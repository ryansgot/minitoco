import { Component } from "react";
import TransactionService from "../services/transaction.service";
import { MiniTocoTransaction } from "../io_models/MiniTocoTransaction";

type Props = {
  user_id: string
};

type State = {
  loading: boolean,
  transactions: Array<MiniTocoTransaction> | undefined,
  message: string
}

export default class TransactionsList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      loading: false,
      transactions: undefined,
      message: ""
    };
  }

  async componentDidMount() {
    const transactions = await TransactionService.getTransactionHistory();
    if (transactions) {
      this.setState({ 
        loading: false,
        transactions: transactions,
        message: ""
      });
    };
  }

  render() {
    const { loading, transactions, message } = this.state;
    const initialFormValues = {
      amount: "",
      to_user_email: "",
    };

    return (
      <div className="col-md-12">
        {transactions ?
          <div>
            <h1>Transaction History</h1>
            <div className="list-group">
              {transactions.map((transaction, index) => (
                <div key={index} className="list-group-item">
                  <div className="row">
                    <div className="col-md-2">
                      <p>{transaction.from_user_id === this.props.user_id ? "SENT" : "RECEIVED"} {transaction.amount.toString()} minitocos</p>
                    </div>
                    <div className="col-md-5">
                      <p>{transaction.from_user_id === this.props.user_id ? "TO" : "FROM"}: {transaction.from_user_id === this.props.user_id ? transaction.to_user_email : transaction.from_user_email}</p>
                    </div>
                    <div className="col-md-5">
                      <p>Date: {transaction.date.toString()}</p>
                    </div>
                  </div>
                </div>)
                )
              }
            </div>
          </div> : 
          <div>
            <h1>Transaction History</h1>
          </div>
        }
      </div>
    );
  }
}