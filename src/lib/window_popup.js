export function popupCenter(url, title, w, h, onClose) {
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    const win = window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left)
    var timer = setInterval(function () {
        if (win.closed) {
            clearInterval(timer);
            onClose(true);
        }
    }, 500);
    return win;
} 