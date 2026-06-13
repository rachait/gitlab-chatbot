import axios from "axios";

const API_URL = "https://gitlab-chatbot-production.up.railway.app";

export const sendMessage = async (question, history = []) => {
  const response = await axios.post(
    `${API_URL}/chat`,
    {
      question,
      history
    }
  );

  return response.data;
};