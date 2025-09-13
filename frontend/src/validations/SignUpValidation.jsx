function validation(values) {

    let errors = {};
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const password_pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;



    if (!values.userName) {
        errors.userName = "User name is required";

    } else {
        errors.userName = ""
    }

    if (!values.email) {
        errors.email = "Email is required";
    } else if (!email_pattern.test(values.email)) {
        errors.email = "Email address is not correct";
    } else {
        errors.email = ""
    }
    if (!values.password) {
        errors.password = "Password is required";
    } else if (password_pattern.test(values.password) === false) {
        errors.password = "Password didn't match";
    }
    else {
        errors.password = ""
    }
    if (!values.submitPassword) {
        errors.submitPassword = "You have to confirm password";
    } else if (values.password != values.submitPassword) {
        errors.submitPassword = "Password didn't match";
    }
    else {
        errors.submitPassword = ""
    }
    if (!values.terms) {
        errors.terms = "You must accept the terms and conditions";
    } else {
        errors.terms = "";
    }

    return errors;

}

export default validation;