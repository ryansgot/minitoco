import axios from "axios";
import qs from "qs";
import { TokenData } from "../io_models/TokenData";
import { MiniTocoUserDetail } from "../io_models/MiniTocoUser";
import { tokenData } from "./local.data";

// TODO: read from environment
const API_URL = "http://localhost:3050/users";

class UserService {
  async login(email: string, password: string) {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: qs.stringify({
        username: email,
        password: password,
        grant_type: 'password'
      }),
      url: `${API_URL}/login`
    }
    const token_data = await axios(options);
    console.log("received token data", token_data);
    localStorage.setItem("token_data", JSON.stringify(token_data.data));
  }

  logout() {
    localStorage.removeItem("token_data");
    localStorage.removeItem("user_detail");
  }

  async register(email: string, first_name: string, last_name: string, password: string) {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: password
      },
      url: API_URL
    };
    const token_data = await axios(options);
    console.log("received token data", token_data);
    localStorage.setItem("token_data", JSON.stringify(token_data.data));
  }

  async getCurrentUser(): Promise<MiniTocoUserDetail | undefined> {
    const token_data = tokenData()
    if (token_data === undefined) {
      return undefined;
    }
    
    const options = {
      method: 'GET',
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token_data.access_token}`
      },
      url: `${API_URL}/me`
    };
    const user_detail = await axios(options);
    localStorage.setItem("user_detail", JSON.stringify(user_detail.data));
    return user_detail.data;
  }
}

export default new UserService();