import axios from 'axios';

export default axios.create({
  baseURL: 'http://192.168.0.5:3001' // IP do seu computador na rede
});
