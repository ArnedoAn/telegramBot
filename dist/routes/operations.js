"use strict";
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
exports.setSaldo = exports.registerOperation = exports.getSaldo = exports.operation = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const TARIFA = 3000;
/* GET users listing. */
router.get("/api/more/:count", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const count = parseInt(req.params.count);
    const result = yield operation(count, TARIFA);
    if (result.status === "success") {
        const register = yield registerOperation(count);
        if (register) {
            res.send(Object.assign(Object.assign({}, result), { op_register: "success" }));
        }
        else {
            res.send({ status: "failed", error: "Error al registrar la operacion" });
        }
    }
    else {
        res.send({ status: "failed", error: "Error al realizar la operacion" });
    }
}));
router.get("/api/less/:count", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const count = parseInt(req.params.count);
    const result = yield operation(count, TARIFA * -1);
    if (result.status === "success") {
        const register = yield registerOperation(count);
        if (register) {
            res.send(Object.assign(Object.assign({}, result), { op_register: "success" }));
        }
        else {
            res.send({ status: "failed", error: "Error al registrar la operacion" });
        }
    }
    else {
        res.send({ status: "failed", error: "Error al realizar la operacion" });
    }
}));
router.get("/api/saldo", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield getSaldo();
        res.send(result);
    }
    catch (err) {
        res.send({ status: "failed", error: "Error al obtener el saldo" });
    }
}));
router.get("/start", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield firstRun();
    res.send(result);
}));
router.get("/", (req, res, next) => {
    res.send("respond with a resource");
});
function operation(count, TARIFA) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const total = count * TARIFA;
            const tarjeta = yield getSaldo();
            const saldo = tarjeta.saldoDisponible + total;
            const result = yield prisma.tarjeta.update({
                where: {
                    id: 1,
                },
                data: {
                    saldoDisponible: saldo,
                },
            });
            return { status: "success", saldo: result.saldoDisponible };
        }
        catch (err) {
            console.log(err);
            return { status: "failed", error: err };
        }
    });
}
exports.operation = operation;
function getSaldo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.tarjeta.findUnique({
                where: {
                    id: 1,
                },
            });
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.getSaldo = getSaldo;
function firstRun() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.tarjeta.create({
                data: {
                    saldoTotal: 0,
                    saldoDisponible: 0,
                },
            });
            console.log(result);
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
function registerOperation(count) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.historial.create({
                data: {
                    fecha: new Date(),
                    monto: count * TARIFA,
                },
            });
            console.log(result);
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
exports.registerOperation = registerOperation;
function setSaldo(saldo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.tarjeta.update({
                where: {
                    id: 1,
                },
                data: {
                    saldoDisponible: saldo,
                },
            });
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
exports.setSaldo = setSaldo;
exports.default = router;
