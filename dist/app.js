"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const operations_1 = __importStar(require("./routes/operations"));
const token = process.env.TTOKEN;
const app = (0, express_1.default)();
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
// view engine setup
app.set("views", path_1.default.join(__dirname, "views"));
app.set("view engine", "jade");
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use("/", operations_1.default);
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
bot.onText(/\/start/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
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
    const siTarjeta = yield (0, operations_1.getSaldo)(chatId.toString());
    if (siTarjeta != null) {
        bot.sendMessage(chatId, `Ya tienes una tarjeta registrada, tu saldo actual es de ${siTarjeta.saldoDisponible}`, options);
    }
    else {
        bot.sendMessage(chatId, "Bienvenido al bot. ¿Qué deseas hacer?", options);
    }
}));
bot.onText(/\/init/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    const siTarjeta = yield (0, operations_1.getSaldo)(chatId.toString());
    if (siTarjeta != null) {
        bot.sendMessage(chatId, `Ya tienes una tarjeta registrada, tu saldo actual es de ${siTarjeta.saldoDisponible}`);
    }
    else {
        const count = yield bot.sendMessage(chatId, `Ingresa tu saldo inicial:`, {
            reply_markup: {
                force_reply: true,
            },
        });
        bot.onReplyToMessage(chatId, count.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
            const text = message.text ? message.text : "0";
            console.log(text);
            const result = yield (0, operations_1.firstRun)(parseFloat(text), chatId.toString());
            if (result) {
                yield bot.sendMessage(chatId, `Tu saldo actual es de ${parseFloat(text)}.`);
            }
            else {
                yield bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
            }
        }));
    }
}));
bot.onText(/\/más/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const ans = yield bot.sendMessage(chatId, "Cantidad de pasajes", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(chatId, ans.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
        const resp = message.text ? parseFloat(message.text) : 0;
        const result = yield (0, operations_1.operation)(resp, 3000, chatId.toString());
        if (result.status === "success") {
            yield (0, operations_1.registerOperation)(resp, chatId.toString());
            bot.sendMessage(chatId, `Se han agregado ${resp * 3000} pesos a tu tarjeta, tu saldo actual es de ${result.saldo}.`);
        }
        else {
            bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
        }
    }));
}));
bot.onText(/\/mas/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const ans = yield bot.sendMessage(chatId, "Cantidad de pasajes", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(chatId, ans.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
        const resp = message.text ? parseFloat(message.text) : 0;
        const result = yield (0, operations_1.operation)(resp, 3000, chatId.toString());
        if (result.status === "success") {
            yield (0, operations_1.registerOperation)(resp, chatId.toString());
            bot.sendMessage(chatId, `Se han agregado ${resp * 3000} pesos a tu tarjeta, tu saldo actual es de ${result.saldo}.`);
        }
        else {
            bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
        }
    }));
}));
bot.onText(/\/menos/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const ans = yield bot.sendMessage(chatId, "Cantidad de pasajes:", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(chatId, ans.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
        const resp = message.text ? parseFloat(message.text) : 0;
        const result = yield (0, operations_1.operation)(resp, 3000 * -1, chatId.toString());
        if (result.status === "success") {
            yield (0, operations_1.registerOperation)(resp * -1, chatId.toString());
            bot.sendMessage(chatId, `Se han restado ${resp * 3000 * -1} pesos a tu tarjeta, tu saldo actual es de ${result.saldo}.`);
        }
        else {
            bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
        }
    }));
}));
bot.onText(/\/saldo/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.getSaldo)(chatId.toString());
    if (result == null) {
        bot.sendMessage(chatId, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
    }
    else {
        bot.sendMessage(chatId, `Tu saldo actual es de ${result.saldoDisponible}.`);
    }
}));
bot.onText(/\/actualizar/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const ans = yield bot.sendMessage(chatId, "Nuevo saldo:", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(chatId, ans.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
        const resp = message.text ? parseFloat(message.text) : 0;
        const result = yield (0, operations_1.setSaldo)(resp, chatId.toString());
        if (result) {
            bot.sendMessage(chatId, `Actualizado. Tu saldo actual es de ${resp}.`);
        }
        else {
            bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
        }
    }));
}));
bot.onText(/\/borrarhistorial/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.deleteHistorial)(chatId.toString());
    if (result) {
        bot.sendMessage(chatId, `Historial borrado.`);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
bot.onText(/\/borrartarjeta/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.deleteTarjeta)(chatId.toString());
    if (result) {
        bot.sendMessage(chatId, `Tarjeta borrada.`);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
bot.onText(/\/historial/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.getHistorial)(chatId.toString());
    if (result) {
        bot.sendMessage(chatId, `Historial: \n${result.map(({ fecha, monto }) => `${formatDate(fecha)} || ${monto}\n`)}`);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
function verifyUser(chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, operations_1.getSaldo)(chatId);
        if (result) {
            return true;
        }
        else {
            return false;
        }
    });
}
//funcion para manejar fechas
function formatDate(date) {
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
    return `${day < 10 ? "0" + day : day}/${monthNames[monthIndex]}/${year} ${hours + 5}:${minutes}:${seconds}`;
}
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
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
exports.default = app;
