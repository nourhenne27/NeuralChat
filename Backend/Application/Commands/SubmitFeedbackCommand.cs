using MediatR;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Commands;

public record SubmitFeedbackCommand(
    Guid MessageId,
    Guid UserId,           // Extrait du JWT dans le controller
    int Score,
    string? Comment
) : IRequest;

public class SubmitFeedbackCommandHandler : IRequestHandler<SubmitFeedbackCommand>
{
    private readonly IFeedbackRepository _feedbackRepository;

    public SubmitFeedbackCommandHandler(IFeedbackRepository feedbackRepository)
    {
        _feedbackRepository = feedbackRepository;
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
    }
}