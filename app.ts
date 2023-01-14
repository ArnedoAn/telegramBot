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
  setSaldo,
  firstRun,
  deleteHistorial,
  deleteTarjeta,
  getHistorial,
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

bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(match![1]);
  const result = await firstRun(parseFloat(match![1]),chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Tu saldo actual es de ${match![1]}`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
  }
});

bot.onText(/\/mas (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const resp = parseFloat(match![1]); // the captured "whatever"
  const result = await operation(resp, 3000, chatId.toString());
  if (result.status === "success") {
    await registerOperation(resp,chatId.toString());
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
  const result = await operation(resp * -1, 3000,chatId.toString());
  if (result.status === "success") {
    await registerOperation(resp * -1,chatId.toString());
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

bot.onText(/\/saldo/, async (msg) => {
  const chatId = msg.chat.id;
  const result = await getSaldo(chatId.toString());
  bot.sendMessage(chatId, `Tu saldo actual es de ${result!.saldoDisponible}`);
});

bot.onText(/\/actualizar  (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const result = await setSaldo(parseFloat(match![1]),chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Tu saldo actual es de ${match![1]}`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
  }
});

bot.onText(/\/borrarhistorial/, async (msg) => {
  const chatId = msg.chat.id;
  const result = await deleteHistorial(chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Historial borrado`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
  }
});

bot.onText(/\/borrartarjeta/, async (msg) => {
  const chatId = msg.chat.id;
  const result = await deleteTarjeta(chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Tarjeta borrada`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
  }
});

bot.onText(/\/historial/, async (msg) => {
  const chatId = msg.chat.id;
  const result = await getHistorial(chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Historial: ${result}`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
  }
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
