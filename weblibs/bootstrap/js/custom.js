(function() {
	$(window).scroll(function() {
		var top = $(document).scrollTop();
		/*$('.intro').css({
			'background-position': '0px -' + (top / 3).toFixed(2) + 'px'
		});*/
		if(top > 50)
			$('#home > .navbar').removeClass('navbar-transparent');
		else
			$('#home > .navbar').addClass('navbar-transparent');
	});
})();

/*
$('a').click(function(){
    if($.attr(this, 'href').localeCompare("#Scrum_Certification") == 0)
    {$('html, body').animate({
        scrollTop: $('[name="' + $.attr(this, 'href').substr(1) + '"]').offset().top
    }, 500);
    return false;
    }
    return true;
});
*/