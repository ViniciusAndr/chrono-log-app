import axios from "axios";

export const chronoApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
});
