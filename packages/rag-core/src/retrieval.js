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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.RAGService = void 0;
var openai_1 = require("@langchain/openai");
var output_parsers_1 = require("@langchain/core/output_parsers");
var prompts_1 = require("@langchain/core/prompts");
/**
 * RAG retrieval and generation service
 */
var RAGService = /** @class */ (function () {
    function RAGService(apiKey, modelName) {
        if (modelName === void 0) { modelName = 'gpt-4'; }
        this.llm = new openai_1.ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: modelName,
            temperature: 0.2, // Lower temperature for more factual responses
        });
        this.defaultSystemPrompt = "You are a helpful legal assistant specializing in mining regulations and compliance in Zambia. \nUse the provided context documents to answer questions accurately. Always cite specific sources when referencing legal information.\n\nIf the context does not contain enough information to answer the question, say so explicitly.\nNever make up legal information or provide advice beyond what is in the context.\n\nIMPORTANT: Always include a disclaimer that this is an explanation based on the provided documents, not formal legal advice, and users should consult with qualified legal professionals for their specific situation.";
    }
    /**
     * Generate answer from query and retrieved chunks
     */
    RAGService.prototype.generateAnswer = function (query, retrievedChunks, systemPrompt) {
        return __awaiter(this, void 0, void 0, function () {
            var context, prompt, chain, answer, sources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context = retrievedChunks
                            .map(function (result, idx) {
                            return "[Source ".concat(idx + 1, " - Document: ").concat(result.chunk.documentId, ", Chunk: ").concat(result.chunk.id, "]\n").concat(result.chunk.content, "\n");
                        })
                            .join('\n---\n\n');
                        prompt = prompts_1.ChatPromptTemplate.fromMessages([
                            prompts_1.SystemMessagePromptTemplate.fromTemplate(systemPrompt || this.defaultSystemPrompt),
                            prompts_1.HumanMessagePromptTemplate.fromTemplate("Context documents:\n{context}\n\nQuestion: {question}\n\nPlease provide a comprehensive answer based on the context above. Include citations to specific sources (e.g., [Source 1], [Source 2])."),
                        ]);
                        chain = prompt.pipe(this.llm).pipe(new output_parsers_1.StringOutputParser());
                        return [4 /*yield*/, chain.invoke({
                                context: context,
                                question: query,
                            })];
                    case 1:
                        answer = _a.sent();
                        sources = retrievedChunks.map(function (result) { return ({
                            documentId: result.chunk.documentId,
                            chunkId: result.chunk.id,
                            content: result.chunk.content.substring(0, 500) + '...', // Truncate for display
                            score: result.score,
                        }); });
                        return [2 /*return*/, {
                                answer: answer,
                                sources: sources,
                            }];
                }
            });
        });
    };
    /**
     * Generate answer with custom system prompt
     */
    RAGService.prototype.generateWithCustomPrompt = function (query, retrievedChunks, customPrompt) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generateAnswer(query, retrievedChunks, customPrompt)];
            });
        });
    };
    return RAGService;
}());
exports.RAGService = RAGService;
