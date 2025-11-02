// const config = require('../config/config')
const { smsProvider } = require('../config/data')
// const { handleCatchError, generateNumber } = require('./utilities.services')
const axios = require('axios')
const moment = require("moment");
const messages = require("../message");
const CommonConfig = require('../config/common');
const { randomInt } = require('crypto');

/**
 * to send otp to user from various providers
 * @param  {string} sProvider, SMS provider name
 * @param  {object} => {sPhone, sOTP}
 * sPhone= user's phone number, sOTP= OTP to send on it
 * @return {object} => {isSuccess, message}
 */
const sendOTPFromProvider = async (provider, users) => {
  try {
    let data;

    if (provider === 'MSG91') {
      data = await msg91SendOrVerifyOTP('send', users);
    } else if (provider === 'SPIDER') {
      data = await spiderSendOTP(users);
    } else if (provider === 'SPIDER_WHATSAPP') {
      data = await spiderProdWhatsAppOTP(users);
      // data = await spiderTestWhatsAppOTP(users);
    }

    return data;

  } catch (error) {
    // console.log(error);
    return {
      isSuccess: false,
      message: error
    }
  }
}

async function spiderSendOTP(users) {

  try {
    const { phoneNumber, countryCode, otpCode } = users

    const pNumber = `${countryCode}${phoneNumber}`
    const msgText = messages['en'].spiderOtp.sms_otp_text.replace('#OTP#', otpCode);

    const tempId = process.env.SPIDER_SMS_OTP_TEMPLATE_ID;

    const response = await axios.get(
      `${process.env.SPIDER_SMS_URL}?APIkey=${process.env.SPIDER_SMS_API_KEY}&SenderID=${process.env.SPIDER_SMS_SENDER_ID}&SMSType=4&Mobile=${pNumber}&MsgText=${msgText}&EntityID=${process.env.SPIDER_SMS_ENTITY_ID}&TemplateID=${tempId}`);

    if (response.statusText === 'OK') {
      return {
        isSuccess: true,
        message: messages['en'].spiderOtp.otp_send_success
      }
    } else {
      return {
        isSuccess: false,
        message: response.data
      }
    }

  } catch (error) {
    console.log('spiderSendOTP Error : ');
    console.log(error);
    return {
      isSuccess: false,
      message: error
    }
  }
}

async function spiderTestWhatsAppOTP(users) {
  try {
    const { phoneNumber, countryCode, otpCode } = users

    const pNumber = `${countryCode}${phoneNumber}`
    const postURL = process.env.SPIDER_TEST_WHATSAPP_URL;

    const requestBody = {
      "apiKey": process.env.SPIDER_TEST_WHATSAPP_API_KEY,
      "campaignName": process.env.SPIDER_TEST_WHATSAPP_CAMPAIGN_NAME,
      "destination": pNumber,
      // "userName": "Jay",
      "templateParams": [otpCode],
      "source": "API",
      "media": {},
      "buttons": [
        {
          "type": "button",
          "sub_type": "url",
          "index": 0,
          "parameters": [
            {
              "type": "text",
              "text": otpCode
            }
          ]
        }
      ]
    }

    const response = await axios.post(postURL, requestBody);

    if (response.statusText === 'OK') {
      return {
        isSuccess: true,
        message: messages['en'].spiderOtp.otp_send_success
      }
    } else {
      return {
        isSuccess: false,
        message: response.data
      }
    }

  } catch (error) {
    console.log('Spider ResendOTP Error : ');
    console.log(error);
    return {
      isSuccess: false,
      message: error
    }
  }
}

async function spiderProdWhatsAppOTP(users) {
  try {
    const { phoneNumber, countryCode, otpCode } = users

    const pNumber = `${countryCode}${phoneNumber}`
    const postURL = process.env.SPIDER_PROD_WHATSAPP_URL;

    const requestBody = {
      "apiKey": process.env.SPIDER_PROD_WHATSAPP_API_KEY,
      "campaignName": process.env.SPIDER_PROD_WHATSAPP_CAMPAIGN_NAME,
      "destination": pNumber,
      // "userName": "Jay",
      "templateParams": [otpCode],
      "source": "API",
      "media": {},
      "buttons": [
        {
          "type": "button",
          "sub_type": "url",
          "index": 0,
          "parameters": [
            {
              "type": "text",
              "text": otpCode
            }
          ]
        }
      ]
    }

    const response = await axios.post(postURL, requestBody);

    if (response.statusText === 'OK') {
      return {
        isSuccess: true,
        message: messages['en'].spiderOtp.otp_send_success
      }
    } else {
      return {
        isSuccess: false,
        message: response.data
      }
    }

  } catch (error) {
    console.log('Spider ResendOTP Error : ');
    console.log(error);
    return {
      isSuccess: false,
      message: error
    }
  }
}

async function isOtpValid(otpDatetime) {
  const currentTime = new Date();
  const diffInMilliseconds = currentTime - otpDatetime; // Difference in milliseconds
  const diffInMinutes = diffInMilliseconds / (1000 * 60); // Convert to minutes

  return diffInMinutes <= CommonConfig.otpTimeLimit;
}

/**
 * to send otp to user from various providers
 * @param  {string} sProvider, SMS provider name
 * @param  {object} => {sPhone, sOTP}
 * sPhone= user's phone number, sOTP= OTP to send on it
 * @return {object} => {isSuccess, message}
 */
// const verifyOTPFromProvider = async (sProvider, oUser) => {
//   try {
//     if (!smsProvider.includes(sProvider)) throw new Error(`Provider ${sProvider} does not exist`)
//     let data

//     if (sProvider === 'MSG91') data = await msg91SendOrVerifyOTP('verify', oUser)

//     if (!data || !data.isSuccess) return { isSuccess: false }
//     return data
//   } catch (error) {
//     handleCatchError(error)
//     return { isSuccess: false }
//   }
// }

/**
 * to generate OTP code with dynamic length
 * @param  {number} nLength
 * @return {string} '1234'
 */
const generateOTP = async (nLength) => {
  const digits = '0123456789'
  let OTP = ''
  for (let i = 0; i < nLength; i++) {
    OTP += digits[randomInt(0, 10)];
  }
  if (Number(OTP).toString().length !== nLength) {
    return generateOTP(nLength)
  }
  return OTP;
}

/**
 * to send or verify otp through MSG91 provider
 * @param  {string} sAction
 * @param  {object} => { sPhone, sOTP }
 * @return {object} => {isSuccess, message}
 */
// async function msg91SendOrVerifyOTP(sAction = '', oUser) {
//   try {
//     const { sPhone, sOTP } = oUser
//     if (!sPhone || !sOTP || !sAction) throw new Error('Invalid details')

//     if (sAction === 'send') {
//       try {
//         const response = await axios.get('https://api.msg91.com/api/v5/otp', {
//           params:
//                   {
//                     template_id: config.MSG91_TEMPLATE_ID,
//                     mobile: `91${sPhone}`,
//                     authkey: config.MSG91_AUTH_KEY,
//                     otp: sOTP
//                   }
//         })
//         if (!response || response.data.type !== 'success') return { isSuccess: false, message: response.data.message || response.data }
//         return { isSuccess: true, message: 'OTP sent successfully!' }
//       } catch (error) {
//         handleCatchError(error)
//       }
//     } else if (sAction === 'verify') {
//       try {
//         const response = await axios.get('https://api.msg91.com/api/v5/otp/verify', {
//           params:
//                       {
//                         mobile: `91${sPhone}`,
//                         authkey: config.MSG91_AUTH_KEY,
//                         otp: sOTP
//                       }
//         })
//         if (!response || response.data.type !== 'success') return { isSuccess: false, message: response.data.message || response.data }

//         const data = response.data && response.data.type === 'success'
//           ? { isSuccess: true, message: 'OTP verified successfully!' }
//           : { isSuccess: false, message: 'OTP verification failed!' }

//         return data
//       } catch (error) {
//         handleCatchError(error)
//       }
//     } else {
//       return { isSuccess: false, message: 'Invalid action!' }
//     }
//   } catch (error) {
//     handleCatchError(error)
//   }
// }


async function spiderTestWhatsAppTemplate(users) {
  try {
    const { phoneNumber, countryCode,firstName,templateId, } = users

    const pNumber = `${countryCode}${phoneNumber}`
    const postURL = process.env.NETSMS_WHATSAPP_URL;

    const requestBody = {
      "apiKey": process.env.NETSMS_WHATSAPP_API_KEY,
      "campaignName": templateId,
      "destination": pNumber,
      "userName": "Shivalik Group",
      "templateParams": [],
      "source": "new-landing-page form",
      "media": {},
      "buttons": [],
      "carouselCards": [],
      "location": {},
      "attributes": {},
      "paramsFallbackValue": {
        "FirstName": "user"
      }
    }

    const response = await axios.post(postURL, requestBody);

    if (response.statusText === 'OK') {
      return {
        isSuccess: true,
        message: messages['en'].campaign.message_success
      }
    } else {
      return {
        isSuccess: false,
        message: response.data
      }
    }
  } catch (error) {
    console.log('Spider Whatsapp Error : ');
    console.log(error);
    return {
      isSuccess: false,
      message: error
    }
  }
}


async function spiderCommunicationTemplate({ phoneNumber, countryCode, firstName, stage, projectName, followupDate,relationshipManagerName,relationshipManagerNumber }) {
  try {
    const pNumber = `${countryCode}${phoneNumber}`;
    const postURL = process.env.NETSMS_WHATSAPP_URL;

    firstName = firstName || 'User';
    projectName = projectName || 'our project';
    followupDate = followupDate || '';
    const formattedDate = followupDate ? moment.utc(followupDate).format('DD-MM-YYYY') : '';
    const formattedTime = followupDate ? moment.utc(followupDate).format('hh:mm A') : '';

    const templateMap = {
      'New Inquiry': {
        campaignName: 'New Lead',
        params: [firstName, projectName, 'https://shivalikgroup.com/']
      },
      'Not Connected': {
        campaignName: 'Not Connected',
        params: [firstName, projectName]
      },
      'Qualified': {
        campaignName: 'Connected',
        params: [firstName, projectName]
      },
      'Meeting Planned': {
        campaignName: 'Meeting Planned',
        params: [firstName, projectName, formattedDate, formattedTime, relationshipManagerNumber]
      },
      'Meeting Done': {
        campaignName: 'Meeting Done',
        params: [firstName, projectName]
      },
      'Blocked': {
        campaignName: 'Block Unit',
        params: [firstName, projectName, relationshipManagerNumber]
      },
      'Booked': {
        campaignName: 'Booked',
        params: [firstName, projectName, relationshipManagerName, relationshipManagerNumber]
      },
      'Lost': {
        campaignName: 'Lost',
        params: [firstName, projectName, 'https://shivalikgroup.com/']
      },
    };

    const template = templateMap[stage];
    if (!template) {
      return {
        isSuccess: false,
        message: `No template mapped for stage: ${stage}`
      };
    }

    const requestBody = {
      "apiKey": process.env.NETSMS_WHATSAPP_API_KEY,
      "campaignName": template.campaignName,
      "destination": pNumber,
      "userName": "Shivalik Group",
      "templateParams": template.params,
      "source": "new-landing-page form",
      "media": {},
      "buttons": [],
      "carouselCards": [],
      "location": {},
      "attributes": {},
      "paramsFallbackValue": {
        "FirstName": "user"
      }
    }


    const response = await axios.post(postURL, requestBody);

    if (response.statusText === 'OK') {
      return {
        isSuccess: true,
        message: messages['en'].leads.whatsapp_message_success
      };
    } else {
      return {
        isSuccess: false,
        message: response.data
      };
    }

  } catch (error) {
    console.error('Spider Whatsapp Error:', error);
    return {
      isSuccess: false,
      message: error.message || error
    };
  }
}


module.exports = {
  sendOTPFromProvider,
  // verifyOTPFromProvider,
  generateOTP,
  isOtpValid,
  spiderTestWhatsAppTemplate,
  spiderCommunicationTemplate
}
