import { User } from '../../models/entities/user.entity.js'

export class UserInfoValidatonService {

    is_valid_username(username: string): Error {
        if (!username) {
            return new Error(1, "Empty Username");
        }
        if (username.length < 4) {
            return new Error(1, "username should be atleast 4 characters long.");
        }
        return new Error(0, "");
    }

    is_valid_email(email: string): Error {
        //regex is taken from http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        if (!email) {
            return new Error(1, "Empty Email");
        }
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(email)) {
            return new Error(1, "Invalid email format");
        }
        return new Error(0, "");
    }

    do_emails_match(email: string, conf_email: string): Error {
        if(!conf_email) {
            return new Error(1, "Empty Confirmation Email");
        }
        if (email != conf_email) {
            return new Error(1, "Emails do not match.");
        }
        return new Error(0, "");
    }

    is_valid_password(password: string): Error {
        if (!password) {
            return new Error(1, "Empty password.");
        }
        if(password.length < 8) {
            return new Error(1, "Password should be atleast 8 characters long." );
        }
        return new Error(0, "");
    }

    do_passwords_match(password: string, conf_password: string): Error {
        if(!conf_password) {
            return new Error(1, "Empty Confirmation Password");
        }
        if (password != conf_password) {
            return new Error(1, "Passwords do not match.");
        }
        return new Error(0, "");
    }

    is_valid_firstname(firstname: string): Error {
        if (!firstname) {
            return new Error(1, "Empty FirstName.");
        }
        return new Error(0, "");
    }

    is_valid_lastname(lastname: string): Error {
        if (!lastname) {
            return new Error(1, "Empty LastName" );
        }
        if (lastname.length < 2) {
            return new Error(1, "lastname should be atleast 2 characters long.");
        }
        return new Error(0, "");
    }

    is_valid_self_bio(self_bio: string): Error {
        return new Error(0, "");
    }

    is_valid_institution(institution: string): Error {
        return new Error(0, "");
    }

    validateAll(userInfo: User, email: string, conf_Email: string, conf_Password: string) {
        return this.do_emails_match(email, conf_Email).isNull() &&
               this.do_passwords_match(userInfo.password, conf_Password).isNull() &&
               this.is_valid_email(email).isNull() &&
               this.is_valid_firstname(email).isNull() &&
               this.is_valid_institution(userInfo.institution).isNull() &&
               this.is_valid_lastname(userInfo.lastname).isNull() &&
               this.is_valid_password(userInfo.password).isNull() &&
               this.is_valid_self_bio(userInfo.self_bio).isNull() &&
               this.is_valid_username(userInfo.username).isNull()
    }
}

export class Error {
    errno: number; //0 valid, 1 invalid
    errstr: string;

    constructor(errno: number, errstr: string) {
        this.errno = errno;
        this.errstr = errstr;
    }

    isNull() {
        if(this.errno == 0) {
            return true;
        }
        else {
            return false;
        }
    }
}