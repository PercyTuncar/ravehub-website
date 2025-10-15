"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var firestore_1 = require("firebase/firestore");
var config_1 = require("@/lib/firebase/config");
var countries = [
    // América del Sur
    { name: "Argentina", code: "AR", region: "América del Sur", flag: "🇦🇷" },
    { name: "Bolivia", code: "BO", region: "América del Sur", flag: "🇧🇴" },
    { name: "Brasil", code: "BR", region: "América del Sur", flag: "🇧🇷" },
    { name: "Chile", code: "CL", region: "América del Sur", flag: "🇨🇱" },
    { name: "Colombia", code: "CO", region: "América del Sur", flag: "🇨🇴" },
    { name: "Ecuador", code: "EC", region: "América del Sur", flag: "🇪🇨" },
    { name: "Guyana", code: "GY", region: "América del Sur", flag: "🇬🇾" },
    { name: "Paraguay", code: "PY", region: "América del Sur", flag: "🇵🇾" },
    { name: "Perú", code: "PE", region: "América del Sur", flag: "🇵🇪" },
    { name: "Surinam", code: "SR", region: "América del Sur", flag: "🇸🇷" },
    { name: "Uruguay", code: "UY", region: "América del Sur", flag: "🇺🇾" },
    { name: "Venezuela", code: "VE", region: "América del Sur", flag: "🇻🇪" },
    // América Central
    { name: "Belice", code: "BZ", region: "América Central", flag: "🇧🇿" },
    { name: "Costa Rica", code: "CR", region: "América Central", flag: "🇨🇷" },
    { name: "El Salvador", code: "SV", region: "América Central", flag: "🇸🇻" },
    { name: "Guatemala", code: "GT", region: "América Central", flag: "🇬🇹" },
    { name: "Honduras", code: "HN", region: "América Central", flag: "🇭🇳" },
    { name: "Nicaragua", code: "NI", region: "América Central", flag: "🇳🇮" },
    { name: "Panamá", code: "PA", region: "América Central", flag: "🇵🇦" },
    // América del Norte
    { name: "Canadá", code: "CA", region: "América del Norte", flag: "🇨🇦" },
    { name: "Estados Unidos", code: "US", region: "América del Norte", flag: "🇺🇸" },
    { name: "México", code: "MX", region: "América del Norte", flag: "🇲🇽" },
    // Europa
    { name: "Alemania", code: "DE", region: "Europa", flag: "🇩🇪" },
    { name: "España", code: "ES", region: "Europa", flag: "🇪🇸" },
    { name: "Francia", code: "FR", region: "Europa", flag: "🇫🇷" },
    { name: "Italia", code: "IT", region: "Europa", flag: "🇮🇹" },
    { name: "Reino Unido", code: "GB", region: "Europa", flag: "🇬🇧" },
    { name: "Portugal", code: "PT", region: "Europa", flag: "🇵🇹" },
    { name: "Países Bajos", code: "NL", region: "Europa", flag: "🇳🇱" },
    { name: "Bélgica", code: "BE", region: "Europa", flag: "🇧🇪" },
    { name: "Suecia", code: "SE", region: "Europa", flag: "🇸🇪" },
    { name: "Noruega", code: "NO", region: "Europa", flag: "🇳🇴" },
    { name: "Dinamarca", code: "DK", region: "Europa", flag: "🇩🇰" },
    { name: "Finlandia", code: "FI", region: "Europa", flag: "🇫🇮" },
    { name: "Irlanda", code: "IE", region: "Europa", flag: "🇮🇪" },
    { name: "Austria", code: "AT", region: "Europa", flag: "🇦🇹" },
    { name: "Suiza", code: "CH", region: "Europa", flag: "🇨🇭" },
    { name: "Polonia", code: "PL", region: "Europa", flag: "🇵🇱" },
    { name: "Rumania", code: "RO", region: "Europa", flag: "🇷🇴" },
    { name: "Grecia", code: "GR", region: "Europa", flag: "🇬🇷" },
    { name: "Turquía", code: "TR", region: "Europa", flag: "🇹🇷" },
    // Asia
    { name: "China", code: "CN", region: "Asia", flag: "🇨🇳" },
    { name: "Japón", code: "JP", region: "Asia", flag: "🇯🇵" },
    { name: "Corea del Sur", code: "KR", region: "Asia", flag: "🇰🇷" },
    { name: "India", code: "IN", region: "Asia", flag: "🇮🇳" },
    { name: "Tailandia", code: "TH", region: "Asia", flag: "🇹🇭" },
    { name: "Vietnam", code: "VN", region: "Asia", flag: "🇻🇳" },
    { name: "Indonesia", code: "ID", region: "Asia", flag: "🇮🇩" },
    { name: "Malasia", code: "MY", region: "Asia", flag: "🇲🇾" },
    { name: "Singapur", code: "SG", region: "Asia", flag: "🇸🇬" },
    { name: "Filipinas", code: "PH", region: "Asia", flag: "🇵🇭" },
    { name: "Rusia", code: "RU", region: "Asia", flag: "🇷🇺" },
    { name: "Arabia Saudita", code: "SA", region: "Asia", flag: "🇸🇦" },
    { name: "Emiratos Árabes Unidos", code: "AE", region: "Asia", flag: "🇦🇪" },
    { name: "Israel", code: "IL", region: "Asia", flag: "🇮🇱" },
    // África
    { name: "Egipto", code: "EG", region: "África", flag: "🇪🇬" },
    { name: "Marruecos", code: "MA", region: "África", flag: "🇲🇦" },
    { name: "Sudáfrica", code: "ZA", region: "África", flag: "🇿🇦" },
    { name: "Nigeria", code: "NG", region: "África", flag: "🇳🇬" },
    { name: "Kenia", code: "KE", region: "África", flag: "🇰🇪" },
    { name: "Ghana", code: "GH", region: "África", flag: "🇬🇭" },
    { name: "Senegal", code: "SN", region: "África", flag: "🇸🇳" },
    { name: "Tanzania", code: "TZ", region: "África", flag: "🇹🇿" },
    // Oceanía
    { name: "Australia", code: "AU", region: "Oceanía", flag: "🇦🇺" },
    { name: "Nueva Zelanda", code: "NZ", region: "Oceanía", flag: "🇳🇿" },
    { name: "Fiji", code: "FJ", region: "Oceanía", flag: "🇫🇯" },
    { name: "Samoa", code: "WS", region: "Oceanía", flag: "🇼🇸" },
    // Caribe
    { name: "Cuba", code: "CU", region: "Caribe", flag: "🇨🇺" },
    { name: "Jamaica", code: "JM", region: "Caribe", flag: "🇯🇲" },
    { name: "Haití", code: "HT", region: "Caribe", flag: "🇭🇹" },
    { name: "República Dominicana", code: "DO", region: "Caribe", flag: "🇩🇴" },
    { name: "Puerto Rico", code: "PR", region: "Caribe", flag: "🇵🇷" },
    { name: "Trinidad y Tobago", code: "TT", region: "Caribe", flag: "🇹🇹" },
    { name: "Barbados", code: "BB", region: "Caribe", flag: "🇧🇧" },
    { name: "Bahamas", code: "BS", region: "Caribe", flag: "🇧🇸" },
];
function seedCountries() {
    return __awaiter(this, void 0, void 0, function () {
        var countriesRef, _i, countries_1, country, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🌍 Iniciando seed de países...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    countriesRef = (0, firestore_1.collection)(config_1.db, "countries");
                    _i = 0, countries_1 = countries;
                    _a.label = 2;
                case 2:
                    if (!(_i < countries_1.length)) return [3 /*break*/, 5];
                    country = countries_1[_i];
                    console.log("Agregando ".concat(country.name, "..."));
                    return [4 /*yield*/, (0, firestore_1.addDoc)(countriesRef, __assign(__assign({}, country), { createdAt: (0, firestore_1.serverTimestamp)(), updatedAt: (0, firestore_1.serverTimestamp)() }))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("✅ Seed de países completado exitosamente!");
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("❌ Error durante el seed de países:", error_1);
                    throw error_1;
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Ejecutar el seed
seedCountries()
    .then(function () {
    console.log("🎉 Proceso completado!");
    process.exit(0);
})
    .catch(function (error) {
    console.error("💥 Error fatal:", error);
    process.exit(1);
});
