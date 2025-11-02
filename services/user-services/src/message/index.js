const message = {
    en: {
        common : {
            create_success: "Created successfully",
            update_success: "Update successfully",
            list_success: "List fetched successfully",
            exists : 'Selected detail is already exists,please try with other.',
            not_exists : 'Selected detail is not exists,please try with other.',
            detail_success : 'Detail fetch successfully.',
            submit_sucess : 'Detail submit successfully.',
            forbidden : 'Blocked: Postman not allowed',
            service_unavailable : 'Service error',
            source_key_invalid: 'Source key invalid.',
            source_key_invalid_other: 'Source key invalid,please try with other.',
        },
        user: {
            not_found: 'Selected phone number is invalid.',
            login_success: 'Login successfully.',
            otp_send_success: 'OTP send successfully to registered number.',
            otp_send_email_success: 'OTP send successfully to email address.',
            otp_not_success: 'OTP send failed,please try again later.',
            user_not_found: 'User does not exists.',
            otp_invalid: 'OTP is invalid.',
            otp_expired: 'OTP is expired.',
            otp_verify_sucess: 'OTP is verified successfully.',
            profile_update_success: 'Profile update successfully.',
            brand_not_exists: 'Company name does not exists.',
            selected_number_already_verified: 'Selected phone number is already verified.',
            number_already_exists: 'Selected phone number is already exists,please try with other.',
            selected_email_already_verified: 'Selected email address is already verified.',
            email_already_exists: 'Selected email address is already exists,please try with other.',
            token_valid_sucess: 'Token valid.',
            logout_success: 'Logout successfully.',
            create_success: 'User create successfully.',
            update_success: 'User update successfully',
            status_success: 'Mask status update successfully.',
            device_info_update_success: 'Device information update successfully.',
            dashboard_success: 'Dashboard successfully.',
            user_delete_success: 'User deleted successfully.',
            detail_fetch_success : 'Detail fetch successfully.',
            profile_image_update_success : 'Profile image upload successfully.',
            user_already_registered : 'User already registered with this phone number.',
            username_exists : 'Username already exists,please try with other.',
            username_valid : 'Username is valid.',
            countryCode_exists: 'Country_code exists',
            professions_required : 'Professions details select atleast 2.',
            reg_exists : 'Registration already exists.',
            reg_sucess : 'Registration successfully.',
            professional_success : 'Professional details submit successfully.',
            role_exists : 'Selected role is already exists.',
            tataloginid_required:"Tata Login id is required",
            invalid_module_type : 'Invalid module type',
            module_type_required : 'Module type is required',
            notification_success: 'Notification sent successfully'
        },

        spiderOtp: {
            sms_otp_text: "#OTP# is your one-time password for registration. Use this OTP to validate your login. Regards, Shivalik Group",
            otp_send_success: 'OTP sent successfully.',
        },

        auth: {
            empty_token: "Please provide access token",
            un_authenticate: "Unauthorized user",
            not_access : 'You are not allowed to access this page.',
        },

        fileUpload: {
            file_not_exists: 'No file uploaded!',
            file_type_invalid: 'Invalid type. Allowed types are: profile, professional, group, messages, documents, images',
            file_mime_type_invalid: 'Invalid file type. Only images (jpeg, jpg, png) are allowed!',
            root_invalid: 'Invalid root. Allowed types are: users, chat, land, knowledges',
            file_does_not_exists : 'File does not exists.',
            sync_file_invalid : 'File has not array value or empty array.',
            sync_file_excuted : 'File execution already exists.',
            sync_success : 'Sync contacts successfully.',
            invalid_root_type: 'Invalid root and type'
        },

        syncContacts : {
            already_exists : 'Selected contact already exists in you contact book.',
            add_success : 'Contact add successfully.',
        },

        roles : {
            not_exists : 'Selected role is not exists,please try with other.',
        },

        leads : {
            data_export_error : 'Data does not exists.',
        },
    },
}

module.exports = message;