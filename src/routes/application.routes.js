const express = require("express");
const Application = require("../models/Application");
const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const Notification = require("../models/Notification");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// Volunteer applies
router.post("/apply/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "volunteer") {
    return res.status(403).json({ message: "Only volunteers can apply" });
  }

  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    const existing = await Application.findOne({
      volunteer: req.user.userId,
      opportunity: req.params.id,
    });

    if (existing) {
      return res.status(400).json({ message: "Already applied" });
    }

    const application = await Application.create({
      volunteer: req.user.userId,
      opportunity: req.params.id,
    });

    try {
      const ngo = await User.findById(opportunity.ngo);
      const volunteer = await User.findById(req.user.userId);

      if (ngo && volunteer) {
        // Create in-app notification for NGO
        await Notification.create({
          recipient: ngo._id,
          title: "New Volunteer Application",
          message: `${volunteer.firstName} has applied for "${opportunity.title}".`,
          type: "new_application",
          relatedId: application._id,
          onModel: "Application"
        });

        // Send email to NGO
        await sendEmail({
          email: ngo.email,
          subject: `New Application for ${opportunity.title}`,
          message: `Hello ${ngo.firstName},\n\nGreat news! ${volunteer.firstName} has applied for your mission: "${opportunity.title}".\n\nPlease log in to your SevaaSetu dashboard to review their application and accept or reject it.\n\nAll The Best,\nThe SevaaSetu Team`
        });
      }
    } catch (err) {
      console.error("Failed to notify NGO:", err);
    }

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// NGO fetch applications for an opportunity
router.get("/ngo/:opportunityId", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const applications = await Application.find({
      opportunity: req.params.opportunityId,
    }).populate("volunteer", "firstName email").populate("opportunity", "title");

    res.json(applications);
  } catch (err) {
    console.error("FETCH APPS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// NGO updates application status
router.put("/status/:applicationId", authMiddleware, async (req, res) => {
  if (req.user.role !== "ngo") {
    return res.status(403).json({ message: "Only NGOs allowed" });
  }

  try {
    const { status } = req.body;

    const updated = await Application.findByIdAndUpdate(
      req.params.applicationId,
      { status },
      { new: true }
    ).populate("volunteer", "firstName email").populate("opportunity", "title ngo location onboarding");

    try {
      if (updated && (status === "accepted" || status === "rejected")) {
        const ngo = await User.findById(req.user.userId);
        const actionText = status === "accepted" ? "accepted" : "declined";
        const titleText = status === "accepted" ? "Application Accepted 🎉" : "Application Update";
        
        let emailMsg = "";
        let emailHtml = "";

        if (status === "accepted") {
          const onboarding = updated.opportunity.onboarding || {};
          const missionDate = onboarding.dateTime ? new Date(onboarding.dateTime).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' }) : "TBD";
          const contactStr = onboarding.contactPerson ? `\n- Contact Person: ${onboarding.contactPerson}` : "";
          const locStr = `\n- Location: ${updated.opportunity.location}`;
          const dateStr = `\n- Date/Time: ${missionDate}`;
          const whatsAppStr = onboarding.whatsappGroup ? `\n- WhatsApp Group: ${onboarding.whatsappGroup}` : "";

          emailMsg = `Hi ${updated.volunteer.firstName},\n\nGreat news! 🎉\n\nYour application for "${updated.opportunity.title}" has been accepted by ${ngo.firstName}.\n\nMission Details:${locStr}${dateStr}${contactStr}${whatsAppStr}\n\nYou're now one step closer to making a real impact. Please visit your SevaaSetu dashboard to view next steps, including instructions and any upcoming check-in details.\n\nWe're excited to have you on board!\n\nBest regards,\nTeam SevaaSetu`;
          
          let detailsHtml = `<ul>
            <li><strong>Location:</strong> ${updated.opportunity.location}</li>
            <li><strong>Date/Time:</strong> ${missionDate}</li>
            ${onboarding.contactPerson ? `<li><strong>Contact Person:</strong> ${onboarding.contactPerson}</li>` : ""}
            ${onboarding.whatsappGroup ? `<li><strong>WhatsApp Group:</strong> <a href="${onboarding.whatsappGroup}">${onboarding.whatsappGroup}</a></li>` : ""}
          </ul>`;

          emailHtml = `
            <p>Hi ${updated.volunteer.firstName},</p>
            <p>Great news! 🎉</p>
            <p>Your application for <strong>“${updated.opportunity.title}”</strong> has been accepted by <strong>${ngo.firstName}</strong>.</p>
            <h3>Mission Details:</h3>
            ${detailsHtml}
            <p>You’re now one step closer to making a real impact. Please visit your SevaaSetu dashboard to view next steps, including instructions and any upcoming check-in details.</p>
            <p>We’re excited to have you on board!</p>
            <p>Best regards,<br/><strong>Team SevaaSetu</strong></p>
          `;
        } else {
          emailMsg = `Hello ${updated.volunteer.firstName},\n\nThank you for your interest in "${updated.opportunity.title}". Unfortunately, the NGO has decided to proceed with other candidates at this time.\n\nWe encourage you to explore other amazing opportunities on SevaaSetu!\n\nAll The Best,\nThe SevaaSetu Team`;
        }

        // Create in-app notification
        await Notification.create({
          recipient: updated.volunteer._id,
          title: titleText,
          message: `Your application for "${updated.opportunity.title}" was ${actionText}.`,
          type: "app_update",
          relatedId: updated._id,
          onModel: "Application"
        });

        // Send email
        const mailOptions = {
          email: updated.volunteer.email,
          subject: `Application ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}: ${updated.opportunity.title}`,
          message: emailMsg
        };
        if (emailHtml) {
          mailOptions.html = emailHtml;
        }

        await sendEmail(mailOptions);
      }
    } catch (err) {
      console.error("Failed to notify volunteer:", err);
    }

    res.json(updated);
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Volunteer fetch their applications
router.get("/my", authMiddleware, async (req, res) => {
  if (req.user.role !== "volunteer") {
    return res.status(403).json({ message: "Only volunteers allowed" });
  }

  try {
    const applications = await Application.find({
      volunteer: req.user.userId,
    })
      .populate("opportunity", "title category location commitment onboarding needs skills")
      .populate({
        path: "opportunity",
        populate: {
          path: "ngo",
          select: "firstName",
        },
      });

    res.json(applications);
  } catch (err) {
    console.error("VOLUNTEER FETCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/ngo",
  authMiddleware,
  allowRoles("ngo"),
  async (req, res) => {
    try {
      const Opportunity = require("../models/Opportunity");

      // Single query: get opportunity IDs, then fetch all applications in one go
      const opportunityIds = await Opportunity.find({
        ngo: req.user.userId,
      }).distinct("_id");

      const applications = await Application.find({
        opportunity: { $in: opportunityIds },
      })
        .populate("volunteer", "firstName")
        .populate("opportunity", "title")
        .sort({ createdAt: -1 })
        .lean();

      res.json(applications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Volunteer QR Check-in Endpoint
router.post("/checkin/:code", authMiddleware, async (req, res) => {
  if (req.user.role !== "volunteer") {
    return res.status(403).json({ message: "Only registered volunteers can check in" });
  }

  try {
    const opp = await Opportunity.findOne({ checkInCode: req.params.code, checkInActive: true });

    if (!opp) {
      return res.status(404).json({ message: "Check-in is not active or the code is invalid." });
    }

    const application = await Application.findOne({
      opportunity: opp._id,
      volunteer: req.user.userId,
    });

    if (!application) return res.status(400).json({ message: "You have not applied for this mission." });
    if (application.status === "completed") return res.status(400).json({ message: "You have already checked in!" });
    if (application.status !== "accepted") return res.status(400).json({ message: "You must be officially accepted by the NGO before checking in." });

    application.status = "completed";
    await application.save();

    try {
      const volunteer = await User.findById(req.user.userId);
      const frontendUrl = process.env.FRONTEND_URL || "https://sevaasetu.in";

      // Create in-app notification
      await Notification.create({
        recipient: req.user.userId,
        title: "Mission Completed! 🏆",
        message: `Congratulations! You've completed "${opp.title}". View your certificate now!`,
        type: "mission_completed",
        relatedId: application._id,
        onModel: "Application"
      });

      // Send email with certificate link
      await sendEmail({
        email: volunteer.email,
        subject: `Mission Complete! Your SevaaSetu Certificate`,
        message: `Hello ${volunteer.firstName},\n\nCongratulations! You have successfully completed "${opp.title}". Thank you for your valuable contribution!\n\nYour official Certificate of Contribution is now available. Click below to view, download, and share it:\n\n${frontendUrl}/certificate/${application._id}\n\nAll The Best,\nThe SevaaSetu Team`
      });
    } catch (err) {
      console.error("Failed to notify completion:", err);
    }

    res.json({ message: "Check-in successful!", opportunityTitle: opp.title });
  } catch (err) {
    console.error("CHECKIN ERROR", err);
    res.status(500).json({ message: "Server error during check-in" });
  }
});

module.exports = router;