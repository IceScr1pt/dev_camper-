const nodemailer = require('nodemailer');

//send email with nodemailer packager
const sendEmail = async (options) => {
  // First i create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      //email is username from mailtrap, in production my real email will be here
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  //Then i create my custom message i want to send in the mail
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `<img src="https://c7.uihere.com/files/626/923/715/dragon-ball-z-ultimate-tenkaichi-dragon-ball-fighterz-goku-krillin-vegeta-goku.jpg">
           <h1>${options.message}</h1>
            `,
  };

  //send the email with the custom message with sendMail() func
  const info = await transporter.sendMail(message);
  console.log(`message sent ${info}`);
};

module.exports = sendEmail;
