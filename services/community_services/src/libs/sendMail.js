
// const config = require('../config/config')
const { smsProvider } = require('../config/data')
const axios = require('axios')
const messages = require("../message");
const ejs = require('ejs');
const path = require('path');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');


// Create a transporter using SMTP (Gmail or custom SMTP)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USERNAME,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
});

/**
 * to send mail to user from email address
 * @param  {string} sProvider, SMTP Mail
 * @param  {object} => {sPhone, sOTP}
 * sPhone= user's phone number, sOTP= OTP to send on it
 * @return {object} => {isSuccess, message}
 */
const sendMail = async (root, fileName, to , subject, templateData) => {
    try {

        // const reqPath = path.join(__dirname, `../templates/${root}/` );
        const emailTemplate = await ejs.renderFile(
            path.join(__dirname, '../', 'templates', `${root}`, `${fileName}`),
            templateData
        );

         // Define the email options
        const mailOptions = {
            // from: "Shivalik Group", // Sender address
            from: "Shivalik Group contact@shivalik.io", // Sender address
            to, // Recipient address
            subject, // Subject line
            html: emailTemplate, // HTML content from EJS
            headers: {
                'X-Priority': '1', // 1 = High Priority
                'X-MSMail-Priority': 'High', // For Microsoft mail clients
                Importance: 'High', // General header for importance
            },
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
        return true;

    } catch (error) {
        console.log("Send Email Error : ");
        console.log(error);
        return false;
    }
}

/**
 * to send mail to user from email address
 * @param  {string} sProvider, SMTP Mail
 * @param  {object} => {sPhone, sOTP}
 * sPhone= user's phone number, sOTP= OTP to send on it
 * @return {object} => {isSuccess, message}
 */
const sendMailCampaign = async (root, fileName, to , subject, templateData) => {
    try {

        // const reqPath = path.join(__dirname, `../templates/${root}/` );
        const emailTemplate = await ejs.renderFile(
            path.join(__dirname, '../', 'templates', `${root}`, `${fileName}`),
            templateData
        );

         // Define the email options
        const mailOptions = {
            // from: "Shivalik Group", // Sender address
            from: "Shivalik Group contact@shivalik.io", // Sender address
            to, // Recipient address
            subject, // Subject line
            html: emailTemplate, // HTML content from EJS
            headers: {
                'X-Priority': '1', // 1 = High Priority
                'X-MSMail-Priority': 'High', // For Microsoft mail clients
                Importance: 'High', // General header for importance
            },
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        return {
            isSuccess: true,
            message:   `Email sent successfully: ${info.messageId}`
          };

    } catch (error) {
        const errMsg = error.response || error.message || 'Unknown error';
        return {
          isSuccess: false,
          message:   `Failed to send email: ${errMsg}`
        };
    }
}


// Set SendGrid API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
/**
 * Send email using SendGrid with optional attachment
 * @param {string} root - Template root folder
 * @param {string} fileName - EJS template name
 * @param {string} to - Recipient email
 * @param {string} subject - Subject line
 * @param {object} templateData - EJS data
 */

const sendGridMail = async (root, fileName, to, subject, templateData) => {
  try {
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, '../', 'templates', `${root}`, `${fileName}`),
      templateData
    );

    // Use SMTP (Gmail) if EMAIL_USER is configured, otherwise use SendGrid
    if (process.env.EMAIL_USER) {
      // Use Gmail SMTP
      const mailOptions = {
        from: {
          name: 'Shivalik Group',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER
        },
        to,
        subject,
        html: emailTemplate,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'High',
        },
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent via Gmail: ${info.messageId}`);

      return {
        isSuccess: true,
        message: 'Email sent successfully',
      };
    } else {
      // Use SendGrid API
      const msg = {
        to,
        from: {
          name: 'Shivalik Group',
          email: process.env.SENDGRID_SENDER_MAIL
        },
        subject,
        html: emailTemplate,
      };

      const response = await sgMail.send(msg);
      console.log(`Email sent via SendGrid: ${response[0].statusCode}`);

      return {
        isSuccess: true,
        message: 'Email sent successfully',
      };
    }

  } catch (error) {
    console.log('Email Error:', error?.response?.body || error.message || error);
    return {
      isSuccess: false,
      message: error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error',
    };
  }
};

const sendGridCSUniverseOfRMail = async (root, fileName, to, subject, templateData) => {
  try {
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, '../', 'templates', `${root}`, `${fileName}`),
      templateData
    );

    const msg = {
      to,
      from: {
        name: 'Universe of R',
        email: process.env.SENDGRID_SENDER_CS_MAIL
      },
      subject,
      html: emailTemplate,
    //   asm: {
    //     groupId: 46239 // your SendGrid unsubscribe group ID
    //   }
      // tracking_settings: {
      //   subscription_tracking: {
      //     enable: false
      //   }
      // }
    };

    const response = await sgMail.send(msg);
    console.log(`Email sent: ${response[0].statusCode}`);

    return {
      isSuccess: true,
      message: 'Email sent successfully',
    };

  } catch (error) {
    console.log('SendGrid Email Error:', error?.response?.body || error);
    return {
      isSuccess: false,
      message: error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error',
    };
  }
};

const sendGridCSUniverseOfRDynamicMail = async (root, fileName, to, subject, templateData, fromEmail , fromTitle ) => {
	try {
		const emailTemplate = await ejs.renderFile(
			path.join(__dirname, '../', 'templates', `${root}`, `${fileName}`),
			templateData
		);

		const msg = {
			to,
			from: {
				name: fromTitle,
				email: fromEmail
			},
			subject,
			html: emailTemplate,
		};

		const response = await sgMail.send(msg);
		console.log(`Email sent: ${response[0].statusCode}`);

		return {
			isSuccess: true,
			message: 'Email sent successfully',
		};

	} catch (error) {
		console.log('SendGrid Email Error:', error?.response?.body || error);
		return {
			isSuccess: false,
			message: error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error',
		};
	}
};


const sendGridMailAttachment = async (templateRoot, templateFile, to, subject, templateData, attachments = []) => {
  try {
      // Render email template
      const emailTemplate = await ejs.renderFile(
          path.join(__dirname, '../', 'templates', templateRoot, templateFile),
          templateData
      );

      // Base message object
      const msg = {
          to,
          from: {
              name: 'Shivalik Group',
              email: process.env.SENDGRID_SENDER_MAIL
          },
          subject,
          html: emailTemplate,
      };

      // Add attachments if provided
      if (attachments.length > 0) {
          msg.attachments = attachments.map(({ content, filename, type }) => ({
              content, // Base64-encoded content
              filename, // File name
              type, // MIME type
              disposition: 'attachment',
          }));
      }

      // Send email
      const response = await sgMail.send(msg);
      console.log(`Email sent: ${response[0].statusCode}`);
      return true;
  } catch (error) {
      console.error('Send Email Error:', error?.response?.body || error.message);
      return false;
  }
};

// const sendGridMailCampaign = async (root, fileName, to, subject, templateData) => {
//   try {
//     let emailTemplate;

//     if (templateData?.template && templateData?.data) {
//       emailTemplate = ejs.render(templateData.template, templateData.data);
//     }
//     else if (root && fileName) {
//       const filePath = path.join(__dirname, '../', 'templates', root, fileName);
//       emailTemplate = await ejs.renderFile(filePath, templateData);
//     }
//     else {
//       throw new Error('Invalid template input: Provide either EJS file path or template string + data.');
//     }

//     const msg = {
//       to,
//       from: {
//         name: 'Shivalik Group',
//         email: process.env.SENDGRID_SENDER_MAIL,
//       },
//       subject,
//       html: emailTemplate,
//     };

//     const response = await sgMail.send(msg);
//     console.log(`Email sent: ${response[0]?.statusCode}`);

//     return {
//       isSuccess: true,
//       message: 'Email sent successfully',
//     };

//   } catch (error) {
//     console.error('SendGrid Email Error:', error?.response?.body || error);
//     return {
//       isSuccess: false,
//       message: error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error',
//     };
//   }
// };

const sendGridMailCampaign = async (root, fileName, to, subject, templateData = {}) => {
  try {
    let emailTemplate;

    if (templateData.data?.html) {
      emailTemplate = templateData.data.html;
    }

    else if (templateData.template && templateData.data) {
      emailTemplate = ejs.render(templateData.template, templateData.data);
    }

    else if (root && fileName) {
      const filePath = path.join(__dirname, '../', 'templates', root, fileName);
      emailTemplate = await ejs.renderFile(filePath, templateData.data || {});
    }
    else {
      throw new Error('Invalid template input.');
    }

    const msg = {
      to,
      from: {
        name: 'Shivalik Group',
        email: process.env.SENDGRID_SENDER_MAIL,
      },
      subject,
      html: emailTemplate,
    };

    const response = await sgMail.send(msg);
    console.log(`Email sent: ${response[0]?.statusCode}`);

    return {
      isSuccess: true,
      message: 'Email sent successfully',
    };

  } catch (error) {
    console.error('SendGrid Email Error:', error?.response?.body || error);
    return {
      isSuccess: false,
      message: error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error',
    };
  }
};


module.exports = {
    sendMail,
    sendMailCampaign,
    sendGridMail,
    sendGridMailAttachment,
    sendGridMailCampaign,
	sendGridCSUniverseOfRMail,
	sendGridCSUniverseOfRDynamicMail,
}
