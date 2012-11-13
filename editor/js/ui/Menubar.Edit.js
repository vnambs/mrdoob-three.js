Menubar.Edit = function ( signals ) {

	var container = new UI.Panel();
	container.setFloat( 'left' );
	container.setWidth( '50px' );
	container.setCursor( 'pointer' );
	container.onMouseOver( function () { options.setDisplay( '' ) } );
	container.onMouseOut( function () { options.setDisplay( 'none' ) } );
	container.onClick( function () { options.setDisplay( 'none' ) } );

	var title = new UI.Panel();
	title.setTextContent( 'Edit' ).setColor( '#666' );
	title.setMargin( '0px' );
	title.setPadding( '8px' )
	container.add( title );

	//

	var options = new UI.Panel();
	options.setWidth( '140px' );
	options.setBackgroundColor( '#ddd' );
	options.setPadding( '0px' );
	options.setBorderTop( 'solid 1px #ccc' );
	options.setStyle( 'box-shadow', [ '0 3px 6px rgba(0,0,0,0.1), 3px 3px 6px rgba(0,0,0,0.2)' ] );
	options.setDisplay( 'none' );
	container.add( options );

	// delete

	var option = new UI.Panel();
	option.setTextContent( 'Delete' ).setColor( '#666' ).setPadding( '6px 12px' );
	option.onClick( function () { signals.removeSelectedObject.dispatch(); } );
	options.add( option );

	addHoverStyle( option );

	//

	function addHoverStyle( element ) {

		element.onMouseOver( function () { element.setBackgroundColor( '#356' ).setColor( '#eee' ); } );
		element.onMouseOut( function () { element.setBackgroundColor( 'transparent' ).setColor( '#666' ) } );

	}

	return container;

}
