import { Component } from "react";
import UserService from "../services/user.service";
import TransactionService from "../services/transaction.service";
import { MiniTocoUserDetail } from "../io_models/MiniTocoUser";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

type Props = {};

type State = {
  loading: boolean,
  currentUser: MiniTocoUserDetail | undefined,
  transaction: { amount: bigint, to_user_email: string } | undefined,
  message: string
}

export default class Profile extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.handleCreateTransaction = this.handleCreateTransaction.bind(this);

    this.state = {
      loading: false,
      currentUser: undefined,
      transaction: undefined,
      message: ""
    };
  }

  async componentDidMount() {
    const current_user = await UserService.getCurrentUser();
    if (current_user) {
      this.setState({ 
        loading: false,
        currentUser: current_user,
        transaction: undefined,
        message: ""
      });
    };
  }

  validationSchema() {
    return Yup.object().shape({
      amount: Yup.number().integer().required("This field is required!"),
      to_user_email: Yup.string().email().required("This field is required!"),
    });
  }

  handleCreateTransaction(formValue: { amount: string, to_user_email: string }) {
    console.log("handleCreateTransaction", formValue);
    const { to_user_email, amount } = formValue;

    this.setState({
      loading: true,
      transaction: {
        amount: BigInt(amount),
        to_user_email: to_user_email
      }
    });
    
    TransactionService.createTransaction(BigInt(amount), to_user_email).then(
      () => {
        window.location.reload();
      },
      error => {
        console.log("error", error);
        let resMessage: string;
        try {
          resMessage = error.response.data.errors[0].msg;
        } catch(err) {
          resMessage = error.toString();
        }
        this.setState({
          loading: false,
          message: resMessage
        });
      }
    );
  }

  render() {
    const { loading, currentUser, transaction, message } = this.state;
    const initialFormValues = {
      amount: "",
      to_user_email: "",
    };

    return (
      <div className="col-md-12">
        {currentUser ?
          <div>
            <header className="jumbotron">
              <h3>
                <strong>{currentUser.user.first_name} {currentUser.user.last_name}</strong>
              </h3>
            </header>
            <p>
              <strong>Balance:</strong>{" "}
              {currentUser.balance.value.toString()} minitocos{" "}, updated: 
              {currentUser.balance.updated_at.toString()}
            </p>
            <p>
              <strong>Id:</strong>{" "}
              {currentUser.user.id}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {currentUser.user.email}
            </p>
            <div className="card card-container">
              <p>Send Mini Tocos</p>

              <Formik
                initialValues={initialFormValues}
                validationSchema={this.validationSchema}
                onSubmit={this.handleCreateTransaction}
              >
                <Form>
                  <div className="form-group">
                    <label htmlFor="amount">Amount </label>
                    <Field name="amount" type="text" className="form-control" />
                    <ErrorMessage
                      name="amount"
                      component="div"
                      className="alert alert-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="to_user_email">Destination user email</label>
                    <Field name="to_user_email" type="email" className="form-control" />
                    <ErrorMessage
                      name="to_user_email"
                      component="div"
                      className="alert alert-danger"
                    />
                  </div>

                  <div className="form-group">
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                      {loading && (
                        <span className="spinner-border spinner-border-sm"></span>
                      )}
                      <span>Send</span>
                    </button>
                  </div>

                  {message && (
                    <div className="form-group">
                      <div className="alert alert-danger" role="alert">
                        {message}
                      </div>
                    </div>
                  )}
                </Form>
              </Formik>
            </div>
          </div> : null}
      </div>
    );
  }
}