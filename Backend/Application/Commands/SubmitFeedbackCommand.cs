using MediatR;
using Domain.Entities;
using Domain.Interfaces;
using System.Text.Json;

namespace Application.Commands;

public record SubmitFeedbackCommand(
    Guid MessageId,
    Guid UserId,
    int Score,
    string? Comment
) : IRequest;

public class SubmitFeedbackCommandHandler : IRequestHandler<SubmitFeedbackCommand>
{
    private readonly IFeedbackRepository _feedbackRepository;
    private readonly IChatSessionRepository _chatSessionRepository;
    private readonly IVectorStore _vectorStore;

    public SubmitFeedbackCommandHandler(
        IFeedbackRepository feedbackRepository,
        IChatSessionRepository chatSessionRepository,
        IVectorStore vectorStore)
    {
        _feedbackRepository = feedbackRepository;
        _chatSessionRepository = chatSessionRepository;
        _vectorStore = vectorStore;
    }

    public async Task Handle(SubmitFeedbackCommand request, CancellationToken cancellationToken)
    {
        var feedback = new Feedback
        {
            MessageId = request.MessageId,
            UserId = request.UserId,
            Score = request.Score,
            Comment = request.Comment
        };

        await _feedbackRepository.AddAsync(feedback);

        // ✅ RLHF : incrémenter PositiveFeedbackCount sur les vrais chunks
        if (request.Score >= 4)
        {
            var sessions = await _chatSessionRepository.GetByUserIdAsync(request.UserId);
            var message = sessions
                .SelectMany(s => s.Messages)
                .FirstOrDefault(m => m.Id == request.MessageId);

            if (message?.ChunkIdsJson != null)
            {
                var chunkIds = JsonSerializer.Deserialize<List<Guid>>(message.ChunkIdsJson);
                if (chunkIds != null && chunkIds.Count > 0)
                    await _vectorStore.RecordPositiveFeedbackAsync(chunkIds);
            }
        }
    }
}