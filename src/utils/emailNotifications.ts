import { Notification } from "./../schema/notification.schema";
import { sendEmail } from "./sendEmailTransporter";

interface Notifications {
  email: string;
  subject: string;
  message: string;
}

export const sendNotification = async ({
  email,
  subject,
  message,
}: Notifications): Promise<void> => {
  try {
    if (!email && subject && message) {
      throw Error("Email, subject and message are required");
    }

    const mailOptions = {
      from: "wmsuoptisched2025@gmail.com",
      to: email,
      subject,
      html: `<p style="font-size: 18px; color: #333; margin-bottom: 10px;">${message}</p>`,
    };

    await sendEmail(mailOptions);
    return;
  } catch (error: any) {
    throw error;
  }
};
