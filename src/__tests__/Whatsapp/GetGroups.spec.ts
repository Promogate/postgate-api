import { Request, Response } from "express";
import WhatsappController from "../../app/controllers/WhatsappController";
import { HttpServer } from "../../app/interfaces/HttpServer";
import { SaveManyWhatsappChats } from "../../app/interfaces/SaveManyWhatsappChats";
import CodechatService from "../../app/services/CodechatService";
import EvolutionService from "../../app/services/EvolutionService";
import WhatsappSessionsService from "../../app/services/WhatsappSessionsService";

// Mock das dependências
const mockHttpServer: jest.Mocked<HttpServer> = {
  on: jest.fn(),
} as any;

const mockWhatsappSessionsService: jest.Mocked<WhatsappSessionsService> =
  {} as any;
const mockSaveManyChatsService: jest.Mocked<SaveManyWhatsappChats> = {} as any;
const mockCodechatService: jest.Mocked<CodechatService> = {
  fetchAllGroups: jest.fn(),
} as any;
const mockEvolutionService: jest.Mocked<EvolutionService> = {
  fetchAllGroups: jest.fn(),
} as any;

describe("WhatsappController - Get Groups", () => {
  let controller: WhatsappController;
  let mockRequest: Partial<Request & { user?: string }>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new WhatsappController(
      mockHttpServer,
      mockWhatsappSessionsService,
      mockSaveManyChatsService,
      mockCodechatService,
      mockEvolutionService
    );

    mockRequest = {
      params: { instanceId: "test-instance-123" },
      body: { token: "test-token" },
      user: "test-user-id",
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return groups when using EvolutionService", async () => {
    const mockGroups = [
      {
        id: "120363123456789012@g.us",
        subject: "Test Group",
        size: 5,
        desc: "Test group description",
        pictureUrl: null,
        creation: 1640995200000,
        owner: "5511999999999@s.whatsapp.net",
        restrict: false,
        announce: true,
      },
    ];

    mockEvolutionService.fetchAllGroups.mockResolvedValue(mockGroups);

    // Simular que o engine é Evolution
    process.env.WHATSAPP_ENGINE = "evolution";

    // Acessar o método privado através de reflexão
    const handleGetGroups = (controller as any).handleGetGroups.bind(
      controller
    );
    await handleGetGroups(mockRequest, mockResponse);

    expect(mockEvolutionService.fetchAllGroups).toHaveBeenCalledWith({
      instanceName: "test-instance-123",
      token: "test-token",
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockGroups);
  });

  it("should return groups when using CodechatService", async () => {
    const mockGroups = [
      {
        id: "120363123456789012@g.us",
        subject: "Test Group",
        size: 5,
        desc: "Test group description",
        pictureUrl: null,
        creation: 1640995200000,
        owner: "5511999999999@s.whatsapp.net",
        restrict: false,
        announce: true,
      },
    ];

    mockCodechatService.fetchAllGroups.mockResolvedValue(mockGroups);

    // Simular que o engine é Codechat
    process.env.WHATSAPP_ENGINE = "codechat";

    // Acessar o método privado através de reflexão
    const handleGetGroups = (controller as any).handleGetGroups.bind(
      controller
    );
    await handleGetGroups(mockRequest, mockResponse);

    expect(mockCodechatService.fetchAllGroups).toHaveBeenCalledWith({
      instanceName: "test-instance-123",
      token: "test-token",
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockGroups);
  });

  it("should return 422 when instanceId is missing", async () => {
    mockRequest.params = {};

    // Acessar o método privado através de reflexão
    const handleGetGroups = (controller as any).handleGetGroups.bind(
      controller
    );
    await handleGetGroups(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.send).toHaveBeenCalledWith({
      message: "Instance ID is missing!",
    });
  });

  it("should handle errors gracefully", async () => {
    const errorMessage = "API Error";
    mockEvolutionService.fetchAllGroups.mockRejectedValue(
      new Error(errorMessage)
    );

    process.env.WHATSAPP_ENGINE = "evolution";

    // Acessar o método privado através de reflexão
    const handleGetGroups = (controller as any).handleGetGroups.bind(
      controller
    );
    await handleGetGroups(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({
      message: errorMessage,
    });
  });
});
