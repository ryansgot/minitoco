import { Component } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

import UserService from "../services/user.service";

type Props = {};

type State = {
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  successful: boolean,
  message: string
};

export default class Register extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.handleRegister = this.handleRegister.bind(this);

    this.state = {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      successful: false,
      message: ""
    };
  }

  validationSchema() {
    return Yup.object().shape({
      first_name: Yup.string()
        .test(
          "len",
          "The first name must be between 1 and 30 characters.",
          (val: any) =>
            val &&
            val.toString().length >= 1 &&
            val.toString().length <= 30
        ).required("first name is required"),
      last_name: Yup.string()
        .test(
          "len",
          "The username must be between 1 and 30 characters.",
          (val: any) =>
            val &&
            val.toString().length >= 1 &&
            val.toString().length <= 30
        ).required("last name is required!"),
      email: Yup.string()
        .email("This is not a valid email.")
        .required("Email is required!"),
      password: Yup.string()
        .test(
          "len",
          "The password must be between 8 and 40 characters.",
          (val: any) =>
            val &&
            val.toString().length >= 8 &&
            val.toString().length <= 40
        )
        .required("Password field is required!"),
    });
  }

  handleRegister(formValue: { first_name: string, last_name: string; email: string; password: string; }) {
    const { first_name, last_name, email, password } = formValue;

    this.setState({
      message: "",
      successful: false
    });

    UserService.register(
      email,
      first_name,
      last_name,
      password
    ).then(
      response => {
        this.setState({
          message: "Registration successful!",
          successful: true
        });
      },
      error => {
        let resMessage: string;
        try {
          resMessage = error.response.data.errors[0].msg;
        } catch(err) {
          resMessage = error.toString();
        }

        this.setState({
          successful: false,
          message: resMessage
        });
      }
    );
  }

  render() {
    const { successful, message } = this.state;

    const initialValues = {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    };

    return (
      <div className="col-md-12">
        <div className="card card-container">
          <Formik
            initialValues={initialValues}
            validationSchema={this.validationSchema}
            onSubmit={this.handleRegister}
          >
            <Form>
              {!successful && (
                <div>
                  <div className="form-group">
                    <label htmlFor="first_name"> First Name </label>
                    <Field name="first_name" type="text" className="form-control" />
                    <ErrorMessage
                      name="first_name"
                      component="div"
                      className="alert alert-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="last_name"> Last Name </label>
                    <Field name="last_name" type="text" className="form-control" />
                    <ErrorMessage
                      name="last_name"
                      component="div"
                      className="alert alert-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email"> Email </label>
                    <Field name="email" type="email" className="form-control" />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="alert alert-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password"> Password </label>
                    <Field
                      name="password"
                      type="password"
                      className="form-control"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="alert alert-danger"
                    />
                  </div>

                  <div className="form-group">
                    <button type="submit" className="btn btn-primary btn-block">Sign Up</button>
                  </div>
                </div>
              )}

              {message && (
                <div className="form-group">
                  <div
                    className={
                      successful ? "alert alert-success" : "alert alert-danger"
                    }
                    role="alert"
                  >
                    {message}
                  </div>
                </div>
              )}
            </Form>
          </Formik>
        </div>
      </div>
    );
  }
}