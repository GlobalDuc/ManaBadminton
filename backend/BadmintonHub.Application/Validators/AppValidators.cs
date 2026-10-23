using BadmintonHub.Application.DTOs;
using FluentValidation;

namespace BadmintonHub.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Tên đăng nhập không được để trống.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Mật khẩu không được để trống.");
    }
}

public class SavePlayerValidator : AbstractValidator<SavePlayerDto>
{
    public SavePlayerValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên thành viên không được để trống.")
            .MaximumLength(120).WithMessage("Họ và tên tối đa 120 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .MaximumLength(25).WithMessage("Số điện thoại không hợp lệ.");
    }
}

public class SaveSessionValidator : AbstractValidator<SaveSessionDto>
{
    public SaveSessionValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề buổi đánh không được để trống.")
            .MaximumLength(180);

        RuleFor(x => x.VenueId)
            .GreaterThan(0).WithMessage("Vui lòng chọn cụm sân thi đấu.");

        RuleFor(x => x.MaxPlayers)
            .InclusiveBetween(2, 64).WithMessage("Số lượng người chơi tối đa phải từ 2 đến 64.");

        RuleFor(x => x.CourtFeeTotal)
            .GreaterThanOrEqualTo(0).WithMessage("Tiền thuê sân không được âm.");

        RuleFor(x => x.ShuttlecockUnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Đơn giá quả cầu không được âm.");
    }
}

public class CreatePaymentValidator : AbstractValidator<CreatePaymentDto>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.PlayerId).GreaterThan(0).WithMessage("Vui lòng chọn thành viên thanh toán.");
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Số tiền thanh toán phải lớn hơn 0 VNĐ.");
    }
}

public class SaveExpenseValidator : AbstractValidator<SaveExpenseDto>
{
    public SaveExpenseValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("Nội dung khoản chi không được để trống.");
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Số tiền chi phải lớn hơn 0 VNĐ.");
        RuleFor(x => x.PaidBy).NotEmpty().WithMessage("Người chi tiền không được để trống.");
    }
}
