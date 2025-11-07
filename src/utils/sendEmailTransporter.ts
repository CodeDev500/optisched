import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
const { AUTH_EMAIL, AUTH_GENERATED_PASS } = process.env;

// const transporter: Transporter = nodemailer.createTransport({
//   service: "gmail",
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: AUTH_EMAIL,
//     pass: AUTH_GENERATED_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_GENERATED_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter error", error);
  } else {
    console.log(success);
  }
});

export const sendEmail = async (
  mailOptions: SendMailOptions
): Promise<void> => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    throw error;
  }
};

export const closeTransporter = (): void => {
  transporter.close();
};
