import { MiniTocoUserDetail } from "../io_models/MiniTocoUser";
import { TokenData } from "../io_models/TokenData";

export const tokenData = (): TokenData | undefined => {
  const token_data_str = localStorage.getItem("token_data");
  if (token_data_str === null) {
    return undefined;
  }
  return JSON.parse(token_data_str);
}

export const localUser = (): MiniTocoUserDetail | undefined => {
  const token_data_str = localStorage.getItem("user_detail");
  if (token_data_str === null) {
    return undefined;
  }
  return JSON.parse(token_data_str);
}