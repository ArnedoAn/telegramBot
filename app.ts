import createError from "http-errors";
import express, { Request, Response } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import TelegramBot from "node-telegram-bot-api";
import * as dotenv from "dotenv";
dotenv.config();

import opRouter, {
  operation,
  registerOperation,
  getSaldo,
} from "./routes/operations";

const token = process.env.TTOKEN!;
const app = express();
const bot = new TelegramBot(token, { polling: true });

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", opRouter);

//Bot manage
bot.onText(/\/mas (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = parseFloat(match![1]); // the captured "whatever"
  const result = await operation(resp, 3000);
  if (result.status === "success") {
    await registerOperation(resp);
    bot.sendMessage(
      chatId,
      `Se han agregado ${
        resp * 3000
      } pesos a tu tarjeta, tu saldo actual es de ${result.saldo}`
    );
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
  }
});

bot.onText(/\/menos (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = parseFloat(match![1]); // the captured "whatever"
  const result = await operation(resp * -1, 3000);
  if (result.status === "success") {
    await registerOperation(resp * -1);
    bot.sendMessage(
      chatId,
      `Se han restado ${
        resp * 3000
      } pesos a tu tarjeta, tu saldo actual es de ${result.saldo}`
    );
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
  }
});

bot.onText(/\/saldo/, async (msg, match) => {
  const chatId = msg.chat.id;
  const result = await getSaldo();
  bot.sendMessage(chatId, `Tu saldo actual es de ${result!.saldoDisponible}`);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: Request, res: Response, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(process.env.PORT, () => {
  console.log("Server runing");
});

export default app;
