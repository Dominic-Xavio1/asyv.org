import nodemailer from "nodemailer"
async function TestEmails(){


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dominicxavio09@gmail.com",
    pass: "fdic icnj kjna ztps", 
  },
});
const mailOptions = {
    from: "dominicxavio09@gmail.com",
    to: "dominicxavio0@gmail.com", 
    subject: "Test Email from My App",
    text: "If you see this, your Nodemailer setup is working!"
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Error occurred:", error.message);
  }
  }
  TestEmails();