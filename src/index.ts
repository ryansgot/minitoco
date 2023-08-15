import express from 'express';
import dotenv from 'dotenv'
import swaggerDocs from './utils/swagger';
import cors from 'cors';
import { user_router } from './routes/user_routes';

dotenv.config();

const app = express();

app.use(cors());  // TODO: do not enable all origins--just the ones we want.
app.use(express.json());
app.use("/users", user_router);

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('minitoco app listening on port: ' + port);
  swaggerDocs(app);
})
