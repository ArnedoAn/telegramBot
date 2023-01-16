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

// bot.onText(/\/test/, (msg) => {
//   const chatId = msg.chat.id;
//   const options = {
//     reply_markup: {
//       keyboard: [[{ text: "Menos" }, { text: "Más" }]],
//       resize_keyboard: true,
//     },
//   };
//   bot.sendMessage(chatId, "Bienvenido al **bot**. ¿Qué deseas hacer? ", options,);
// });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        [{ text: "/init" }, { text: "/saldo" }],
        [{ text: "/más" }, { text: "/menos" }],
        [{ text: "/actualizar" }, { text: "/historial" }],
        [{ text: "/borrarhistorial" }, { text: "/borrartarjeta" }],
      ],
      resize_keyboard: true,
    },
  };
  const siTarjeta = await getSaldo(chatId.toString());
  if (siTarjeta != null) {
    bot.sendMessage(
      chatId,
      `Ya tienes una tarjeta registrada, tu saldo actual es de ${siTarjeta.saldoDisponible}`,
      options
    );
  } else {
    bot.sendMessage(chatId, "Bienvenido al bot. ¿Qué deseas hacer?", options);
  }
});

bot.onText(/\/init/, async (msg) => {
  const chatId = msg.chat.id;
  const siTarjeta = await getSaldo(chatId.toString());
  if (siTarjeta != null) {
    bot.sendMessage(
      chatId,
      `Ya tienes una tarjeta registrada, tu saldo actual es de ${siTarjeta.saldoDisponible}`
    );
  } else {
    const count = await bot.sendMessage(chatId, `Ingresa tu saldo inicial:`, {
      reply_markup: {
        force_reply: true,
      },
    });
    bot.onReplyToMessage(chatId, count.message_id, async (message) => {
      const text = message.text ? message.text : "0";
      console.log(text);
      const result = await firstRun(parseFloat(text), chatId.toString());
      if (result) {
        await bot.sendMessage(
          chatId,
          `Tu saldo actual es de ${parseFloat(text)}.`
        );
      } else {
        await bot.sendMessage(
          chatId,
          `Ha ocurrido un error, intenta de nuevo.`
        );
      }
    });
  }
});

bot.onText(/\/más/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const ans = await bot.sendMessage(chatId, "Cantidad de pasajes", {
    reply_markup: {
      force_reply: true,
    },
  });
  bot.onReplyToMessage(chatId, ans.message_id, async (message) => {
    const resp = message.text ? parseFloat(message.text) : 0;
    const result = await operation(resp, 3000, chatId.toString());
    if (result.status === "success") {
      await registerOperation(resp, chatId.toString());
      bot.sendMessage(
        chatId,
        `Se han agregado ${
          resp * 3000
        } pesos a tu tarjeta, tu saldo actual es de ${result.saldo}.`
      );
    } else {
      bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
  });
});

bot.onText(/\/mas/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const ans = await bot.sendMessage(chatId, "Cantidad de pasajes", {
    reply_markup: {
      force_reply: true,
    },
  });
  bot.onReplyToMessage(chatId, ans.message_id, async (message) => {
    const resp = message.text ? parseFloat(message.text) : 0;
    const result = await operation(resp, 3000, chatId.toString());
    if (result.status === "success") {
      await registerOperation(resp, chatId.toString());
      bot.sendMessage(
        chatId,
        `Se han agregado ${
          resp * 3000
        } pesos a tu tarjeta, tu saldo actual es de ${result.saldo}.`
      );
    } else {
      bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
  });
});

bot.onText(/\/menos/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const ans = await bot.sendMessage(chatId, "Cantidad de pasajes:", {
    reply_markup: {
      force_reply: true,
    },
  });
  bot.onReplyToMessage(chatId, ans.message_id, async (message) => {
    const resp = message.text ? parseFloat(message.text) : 0;
    const result = await operation(resp, 3000 * -1, chatId.toString());
    if (result.status === "success") {
      await registerOperation(resp * -1, chatId.toString());
      bot.sendMessage(
        chatId,
        `Se han restado ${
          resp * 3000 * -1
        } pesos a tu tarjeta, tu saldo actual es de ${result.saldo}.`
      );
    } else {
      bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
  });
});

bot.onText(/\/saldo/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await getSaldo(chatId.toString());
  if (result == null) {
    bot.sendMessage(
      chatId,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
  } else {
    bot.sendMessage(chatId, `Tu saldo actual es de ${result.saldoDisponible}.`);
  }
});

bot.onText(/\/actualizar/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const ans = await bot.sendMessage(chatId, "Nuevo saldo:", {
    reply_markup: {
      force_reply: true,
    },
  });
  bot.onReplyToMessage(chatId, ans.message_id, async (message) => {
    const resp = message.text ? parseFloat(message.text) : 0;
    const result = await setSaldo(resp, chatId.toString());
    if (result) {
      bot.sendMessage(chatId, `Actualizado. Tu saldo actual es de ${resp}.`);
    } else {
      bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
    }
  });
});

bot.onText(/\/borrarhistorial/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await deleteHistorial(chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Historial borrado.`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

bot.onText(/\/borrartarjeta/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await deleteTarjeta(chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Tarjeta borrada.`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

bot.onText(/\/historial/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await getHistorial(chatId.toString());
  if (result) {
    bot.sendMessage(
      chatId,
      `Historial: \n${result.map(
        ({ fecha, monto }: { fecha: Date; monto: Number }) =>
          `${formatDate(fecha)} || ${monto}\n`
      )}`
    );
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

async function verifyUser(chatId: string) {
  const result = await getSaldo(chatId);
  if (result) {
    return true;
  } else {
    return false;
  }
}

//funcion para manejar fechas
function formatDate(date: Date) {
  let monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  let day = date.getDate();
  let monthIndex = date.getMonth();
  let year = date.getFullYear();

  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  return `${day < 10 ? "0" + day : day}/${monthNames[monthIndex]}/${year} ${
    hours + 5
  }:${minutes}:${seconds}`;
}

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