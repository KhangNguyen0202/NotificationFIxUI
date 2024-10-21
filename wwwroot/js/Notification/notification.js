// View and Add
$(document).ready(function () {
    // Đảm bảo dialog overlay được ẩn ngay khi trang tải
    $('#dialogOverlay').hide();

    // Khi nhấn nút "Add Notification", mở modal thêm thông báo
    $('.add-notification').click(function () {
        $('#addNotificationModal').modal('show');
    });

    // Khi nhấn nút "Send" trong form Add Notification, kiểm tra dữ liệu trước khi hiển thị dialog chọn user
    $('#notificationForm').on('submit', function (event) {
        event.preventDefault(); // Ngăn form submit thật sự

        // Lấy các giá trị từ form Add Notification
        var notificationTitle = $('#subject').val();
        var notificationContent = $('#content').val();
        var notificationType = $('.select-group select:eq(1)').val(); // Lấy giá trị của thẻ select loại thông báo

        // Kiểm tra xem các trường cần thiết đã được điền chưa
        if (!notificationTitle || !notificationContent || !notificationType) {
            alert("Please fill in all required fields before selecting users.");
            return; // Ngăn không cho hiện overlay dialog nếu dữ liệu chưa đầy đủ
        }

        // Nếu tất cả dữ liệu đã được điền, hiển thị overlay dialog
        $('#dialogOverlay').fadeIn();

        // Gọi AJAX để lấy danh sách user từ server khi hiển thị dialog
        $.get('/Notification/GetUsers', function (data) {
            // Giả sử server trả về danh sách user dưới dạng JSON
            var userList = '';
            $.each(data, function (index, user) {
                userList += '<li><input type="checkbox" value="' + user.user_id + '">' + user.full_name + '</li>';
            });
            $('#userList').html(userList); // Thêm danh sách user vào dialog
        }).fail(function () {
            alert('Failed to load users'); // Thông báo nếu việc tải dữ liệu thất bại
        });
    });

    // Khi nhấn nút "Send" trong dialog overlay, lấy danh sách user đã chọn và các giá trị từ form
    $('#sendToUsers').click(function () {
        var selectedUsers = [];
        $('#dialogOverlay input[type="checkbox"]:checked').each(function () {
            selectedUsers.push($(this).val());
        });

        if (selectedUsers.length === 0) {
            alert("No users selected");
            return;
        }

        // Lấy các giá trị từ form Add Notification
        var notificationTitle = $('#subject').val();
        var notificationContent = $('#content').val();
        var notificationType = $('.select-group select:eq(1)').val(); // Lấy giá trị của thẻ select loại thông báo

        // Kiểm tra lại xem các trường cần thiết đã được điền chưa
        if (!notificationTitle || !notificationContent || !notificationType) {
            alert("Please fill in all required fields.");
            return;
        }

        // Tạo object chứa dữ liệu để gửi lên server
        var notificationData = {
            UserIds: selectedUsers, // Danh sách UserId
            NotificationTitle: notificationTitle, // Tiêu đề thông báo
            NotificationContent: notificationContent, // Nội dung thông báo
            NotificationType: notificationType // Loại thông báo (Info, Warning, Reminder)
        };

        console.log("Sending notification data: ", notificationData); // In ra console để kiểm tra dữ liệu

        // Gửi dữ liệu lên server qua AJAX để lưu thông báo
        $.ajax({
            url: '/Notification/CreateNotification', // Đường dẫn đến action CreateNotification
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(notificationData),
            success: function (response) {
                if (response.success) {
                    alert("Notification created successfully.");
                    $('#dialogOverlay').fadeOut(); // Ẩn overlay sau khi gửi
                    $('#addNotificationModal').modal('hide'); // Đóng modal sau khi tạo thông báo
                } else {
                    alert("Failed to create notification.");
                }
            },
            error: function (error) {
                alert("Error creating notification.");
                console.error("Error:", error.responseText); // In ra lỗi để debug
            }
        });
    });

    // Đảm bảo khi nhấn vào bất kỳ vùng nào ngoài dialog, dialog sẽ bị đóng
    $('#dialogOverlay').click(function (e) {
        if (e.target === this) {
            $(this).fadeOut(); // Ẩn overlay khi nhấn ra ngoài
        }
    });
});


// Edit
$(document).on('click', '.edit', function () {
    $('#notificationsModal').modal('hide');
    var notificationId = $(this).closest('.notification-item').data('notification-id');

    // Gọi AJAX để lấy dữ liệu của Notification
    $.get('/Notification/GetNotificationById', { id: notificationId }, function (response) {
        if (response.success) {
            // Đổ dữ liệu vào form chỉnh sửa
            $('#editNotificationId').val(response.data.notificationId);
            $('#editSubject').val(response.data.notificationTitle);
            $('#editContent').val(response.data.notificationContent);
            console.log(response.data.notificationType);

            // Gán giá trị của notification type vào select và đảm bảo nó hiển thị đúng
            $('#editType').val(response.data.notificationType).trigger('change');

            // Hiển thị Modal Edit
            $('#editNotificationModal').modal('show');
        } else {
            alert('Failed to load notification data.');
        }
    }).fail(function () {
        alert('Error fetching notification data.');
    });
});

$('#editNotificationForm').on('submit', function (event) {
    event.preventDefault();

    // Lấy các giá trị từ form
    var notificationId = $('#editNotificationId').val();
    var notificationTitle = $('#editSubject').val();
    var notificationContent = $('#editContent').val();
    var notificationType = $('#editType').val();

    // Kiểm tra xem các trường cần thiết đã được điền chưa
    if (!notificationTitle || !notificationContent || !notificationType) {
        alert("Please fill in all required fields.");
        return;
    }

    // Tạo object chứa dữ liệu để gửi lên server
    var updatedNotificationData = {
        NotificationId: notificationId,
        NotificationTitle: notificationTitle,
        NotificationContent: notificationContent,
        NotificationType: notificationType
    };

    // Gửi dữ liệu lên server qua AJAX để cập nhật thông báo
    $.ajax({
        url: '/Notification/EditNotification',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(updatedNotificationData),
        success: function (response) {
            if (response.success) {
                alert("Notification updated successfully.");
                $('#editNotificationModal').modal('hide'); // Đóng modal sau khi cập nhật
                location.reload(); // Tải lại trang để hiển thị thông tin cập nhật
            } else {
                alert("Failed to update notification.");
            }
        },
        error: function (error) {
            alert("Error updating notification.");
            console.error("Error:", error.responseText);
        }
    });
});


//Delete
$(document).on('click', '.delete', function () {
    var notificationId = $(this).closest('.notification-item').data('notification-id');

    if (confirm("Are you sure you want to delete this notification?")) {
        // Gửi yêu cầu AJAX để xóa notification
        $.ajax({
            url: '/Notification/DeleteNotification', // Đường dẫn đến action DeleteNotification
            method: 'POST',
            data: { id: notificationId },
            success: function (response) {
                if (response.success) {
                    alert("Notification deleted successfully.");
                    location.reload(); // Tải lại trang sau khi xóa thành công
                } else {
                    alert("Failed to delete notification: " + response.message);
                }
            },
            error: function (error) {
                alert("Error deleting notification.");
                console.error("Error:", error.responseText);
            }
        });
    }
});
