import { TokenData } from "../io_models/TokenData";

export default function tokenData(): TokenData | undefined {
  const token_data_str = localStorage.getItem("token_data");
  if (token_data_str === null) {
    return undefined;
  }
  return JSON.parse(token_data_str);
}