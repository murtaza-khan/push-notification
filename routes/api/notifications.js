const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const serviceAccount = require("../../service-account-key.json");
const NotificationDetail = require("../../models/notification-detail");
const User = require("../../models/user");
const _ = require("lodash");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Send push notification to all devices, of all platforms.
 *
 */
router.post("/send-to-all", async (req, res, next) => {
  const { content, title } = req.body;
  if (!content) {
    return res
      .status(404)
      .send({ "error-message": "Please send content for notification" });
  }
  if (!title) {
    return res
      .status(404)
      .send({ "error-message": "Please send title for notification" });
  }
  // Create a list containing up to 500 registration tokens.
  // These registration tokens come from the client FCM SDKs.
  const users = await User.find().select("notificationToken phone");
  let registrationTokens = [];
  let phoneNumbers = [];
  for (const u of users) {
    if (u.notificationToken) {
      registrationTokens.push(u.notificationToken);
    }
    if (u.phone) {
      phoneNumbers.push(u.phone);
    }
  }
  const message = {
    notification: {
      title: title,
      body: content,
    },
    tokens: registrationTokens,
  };

  /**
   * same API used for the send sms with just added realtime sms configration here
   */
  try {
    const response = await sendNotification(message, registrationTokens);
    res.status("200").send(response);
  } catch (error) {
    res.status("400").send(error);
  }
});

router.post("/send-by-email", async (req, res, next) => {
  const { content, title, email } = req.body;
  if (!email) {
    return res
      .status(404)
      .send({ "error-message": "Email is required for the notification" });
  }
  if (!content) {
    return res
      .status(404)
      .send({ "error-message": "Please send content for notification" });
  }
  if (!title) {
    return res
      .status(404)
      .send({ "error-message": "Please send title for notification" });
  }
  // Create a list containing up to 500 registration tokens.
  // These registration tokens come from the client FCM SDKs.
  const user = await User.findOne({ email }).select("notificationToken phone");
  let registrationTokens = [];
 registrationTokens.push(user.notificationToken);
  const message = {
    notification: {
      title: title,
      body: content,
    },
    tokens: registrationTokens,
  };

  /**
   * same API used for the send sms with just added realtime sms configration here
   */
  try {
    const response = await sendNotification(message, registrationTokens);
    res.status("200").send(response);
  } catch (error) {
    res.status("400").send(error);
  }
});

async function sendNotification(message, registrationTokens) {
  // sending push notification
  return admin
    .messaging()
    .sendMulticast(message)
    .then((response) => {
      // Making chunks of responses
      const chunkSize = 100;
      const chunkedReponses = _.chunk(response.responses, chunkSize);
      // Storing the responses in chunks
      chunkedReponses.forEach(async (chunk) => {
        // Preparing the docs to insert
        const docsToInsertInBulk = chunk.map((resp, idx) => ({
          userId: registrationTokens[idx],
          status: resp.success,
          reason: resp.success ? undefined : resp.error.message,
          messageId: resp.success ? resp.messageId : undefined,
        }));
        // Insert the prepared chunk of docs in bulk
        NotificationDetail.insertMany(docsToInsertInBulk);
      });
      return response;
    })
    .catch((error) => {
      throw error;
    });
}
module.exports = router;
