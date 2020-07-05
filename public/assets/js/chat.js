var sendMsg, receiveMsg, serviceMessage;

$('document').ready(() => {
    (function () {
        $(function () {
            var getMessageText, message_side;
            getMessageText = function () {
                var $message_input;
                $message_input = $('#btn-input');
                return $message_input.val();
            };
            sendMsg = function (text) {
                const $message = $('\
                    <li class="left clearfix">\
                        <span class="chat-img pull-left">\
                            <img src="http://placehold.it/50/55C1E7/fff&amp;text=You" alt="User Avatar" class="rounded-circle">\
                        </span>\
                        <div class="chat-body clearfix">\
                            <div class="header">\
                                <strong class="pull-right primary-font">You</strong>\
                                <small class=" text-muted"><span class="fa fa-clock-o fa-1"></span> Now</small>\
                            </div>\
                            <p>'+text+'</p>\
                        </div>\
                    </li>');

                var $messages;
                if (text.trim() === '') {
                    return;
                }
                $('#btn-input').val('');
                $messages = $('.messages');
                socket.emit("send_message", text);
                $message.appendTo('.chat');
                return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
            };
            receiveMsg = function (user, text) {
                const $message = $('\
                    <li class="left clearfix">\
                        <span class="chat-img pull-left">\
                            <img src="http://placehold.it/50/55C1E7/fff&amp;text='+user.substr(0,2)+'" alt="User Avatar" class="rounded-circle">\
                        </span>\
                        <div class="chat-body clearfix">\
                            <div class="header">\
                                <strong class="pull-right primary-font">'+user+'</strong>\
                                <small class=" text-muted"><span class="fa fa-clock-o fa-1"></span> Now</small>\
                            </div>\
                            <p>'+text+'</p>\
                        </div>\
                    </li>');
                var $messages;
                if (text.trim() === '') {
                    return;
                }
                $messages = $('.messages');
                $message.appendTo('.chat');
                return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
            };

            serviceMessage = function (text) {
                const $message = $('\
                    <li class="left clearfix">\
                        <div class="chat-body clearfix">\
                            <div class="header">\
                                <small class=" text-muted"><span class="fa fa-clock-o fa-1"></span> Now</small>\
                            </div>\
                            <p><strong>'+text+'<strong></p>\
                        </div>\
                    </li>');
                var $messages;
                if (text.trim() === '') {
                    return;
                }
                $messages = $('.messages');
                $message.appendTo('.chat');
                return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
            };

            $('.send_message').click(function (e) {
                return sendMsg(getMessageText());
            });
            $('.message_input').keyup(function (e) {
                if (e.which === 13) {
                    return sendMsg(getMessageText());
                }
            });
        });
    }.call(this));
});