using MediatR;
using Domain.Interfaces;

namespace Application.Commands;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand>
{
    private readonly IUserRepository _userRepository;

    public DeleteUserCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        await _userRepository.GetByIdAsync(request.UserId); // lève KeyNotFoundException si absent
        await _userRepository.DeleteAsync(request.UserId);
    }
} 
