/*!
    datepicker.js v0.4
    By Amsul (http://amsul.ca)

    Updated: 23 October, 2012

    (c) Amsul Naeem, 2012 - http://amsul.ca
    Licensed under MIT ("expat" flavour) license.
    Hosted on http://github.com/amsul/datepicker.js
*/

/*jshint
    debug: true,
    devel: true,
    browser: true,
    asi: true
*/



;(function( $, window, document, undefined ) {

    'use strict';


    /**
     *  Create a Date Picker
     */
    var DatePicker = (function() {

        var

            // Picker prototype
            P,


            // Constants
            DAYS_IN_WEEK = 7,
            WEEKS_IN_CALENDAR = 6,
            DAYS_IN_CALENDAR = WEEKS_IN_CALENDAR * DAYS_IN_WEEK,


            /**
             *  Helper functions
             */

            // Check if a value is an array
            isArray = Array.isArray || function( value ) {
                return {}.toString.call( value ) === '[object Array]'
            },

            // Wrap an item
            wrapItemWithTagAndClassAndBinding = function( wrapper, item, klass, data ) {

                // If the item is an array, do a join
                if ( isArray( item ) ) item = item.join( '' )

                // Check for a class
                klass = ( klass ) ? ' class="' + klass + '"' : ''

                // Check for a data binding
                data = ( data && data.name ) ? ' data-' + data.name + '="' + data.value + '"' : ''

                // Return the wrapped item
                return '<' + wrapper + klass + data + '>' + item + '</' + wrapper + '>'
            }



        /**
         *  Default options for Picker
         */
        Picker.defaults = {

            months_full: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
            months_short: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
            days_full: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
            days_short: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],


            class_calendar: 'datepicker--calendar',
            class_calendar_body: 'datepicker--calendar__body',

            class_week: 'datepicker--week',
            class_weekdays: 'datepicker--weekday',

            class_day_selected: 'datepicker--day__selected',
            class_day_today: 'datepicker--day__today',
            class_day_infocus: 'datepicker--day__infocus',
            class_day_outfocus: 'datepicker--day__outfocus',

            class_box_months: 'datepicker--holder__months',
            class_box_years: 'datepicker--holder__years',
            class_box_weekdays: 'datepicker--holder__weekdays'

        } //Picker.defaults



        /**
         *  Picker constructor
         */
        function Picker( $element, options ) {

            // Ensure a valid element was passed
            if ( $element[ 0 ].nodeName !== 'INPUT' ) return false

            // Ensure workable options are available
            if ( typeof options !== 'object' ) options = {}

            // Merge the settings
            P.settings = $.extend( {}, Picker.defaults, options )

            // Store the element
            P.$element = $element

            // Create and return the picker
            return P.create( $element, options )
        }



        /**
         *  Picker prototype
         */
        P = Picker.prototype = {

            /**
             *  Picker constructor
             */
            constructor: Picker,


            /**
             *  Create the picker
             */
            create: function( $element, options ) {


                // Convert into a regular text input
                // to remove user-agent stylings
                P.$element[ 0 ].type = 'text'


                // P.calendar = P.createCalendar().render()

                // Create a calendar object
                P.calendar = P.createCalendarObject()

                // Create the calendar body
                P._calendarBody = P.calendar.createBody()

                console.log( P )

                return P
            },



            /**
             *  Create a calendar object
             */
            createCalendarObject: function() {

                return {


                    /**
                     *  Create the calendar head
                     */
                    _calendarHead: (function() {

                        var
                            wrapTableHeader = function( item, index ) {
                                return wrapItemWithTagAndClassAndBinding( 'th', item, P.settings.class_weekdays )
                            }

                        // Go through each day of the week
                        // and return a wrapped the header
                        // and then do a join.
                        // Take the result and apply another
                        // wrapper to group the cells
                        return wrapItemWithTagAndClassAndBinding( 'thead', P.settings.days_short.map( wrapTableHeader ) )
                    })(), //_calendarHead


                    /**
                     *  Create the calendar body
                     */
                    createBody: function() {

                        var
                            // The loop date object
                            loopDate,

                            // A pseudo index while be the divider
                            // between the previous month and the
                            // focused month
                            pseudoIndex,

                            // An index to keep an updated index
                            // of the day of the week in each loop
                            dayOfWeekIndex,

                            // A class array that will hold all the
                            // classes to apply to each looped day
                            klass,

                            // A data binding to apply to each day
                            dataBinding,

                            // Get the focused date
                            dateFocused = P.getDateFocused(),

                            // Get the selected date
                            dateSelected = P.getDateSelected(),

                            // Count the number of days in the month
                            countMonthDays = P.getCountDays( dateFocused.YEAR, dateFocused.MONTH ),

                            // Count the days to shift the start of the month
                            countShiftby = P.getCountShiftDays( dateFocused.DATE, dateFocused.DAY ),

                            // Collection of the dates visible on the calendar
                            // * this gets discarded at the end
                            calendarDates = [],

                            // Collection of weeks visible on calendar
                            calendarWeeks = []



                        // Go through all the days in the calendar
                        // and map a calendar date
                        for ( var index = 0; index < DAYS_IN_CALENDAR; index += 1 ) {

                            // Get the distance between the index
                            // and the count to shift by.
                            // This will serve as the separator
                            // between the previous, current,
                            // and next months.
                            pseudoIndex = index - countShiftby


                            // Figure out the day of the week
                            dayOfWeekIndex = index % DAYS_IN_WEEK


                            // If the pseudoIndex is zero or negative,
                            // we need the dates from the previous month.
                            // If the pseudoIndex is greater than the days
                            // in the month, we need dates from next month.
                            if ( pseudoIndex <= 0 || pseudoIndex > countMonthDays ) {

                                // Create a new date with a negative or positive pseudoIndex
                                loopDate = new Date( dateFocused.YEAR, dateFocused.MONTH, pseudoIndex )

                                // Change it into a loop date object
                                loopDate = {
                                    YEAR: loopDate.getFullYear(),
                                    MONTH: loopDate.getMonth(),
                                    DATE: loopDate.getDate(),
                                    DAY: index % DAYS_IN_WEEK
                                }

                                // Set the class as out of focus
                                klass = P.settings.class_day_outfocus

                            }


                            // If the pseudoIndex is greater than 0
                            // and less than or equal to number of
                            // days in the month, we generate
                            // all the dates this month
                            else {

                                // Create a loop date object
                                loopDate = {

                                    // Same as current year
                                    YEAR: dateFocused.YEAR,

                                    // Same as current month
                                    MONTH: dateFocused.MONTH,

                                    // The date is the pseudoIndex
                                    DATE: pseudoIndex,

                                    // The day is the index position in the week
                                    DAY: dayOfWeekIndex
                                }


                                // Set the class
                                klass = (function() {

                                    var tempKlass = []

                                    // Set the class as in focus
                                    tempKlass.push( P.settings.class_day_infocus )

                                    // If it's today, add the class
                                    if ( loopDate.DATE === dateFocused.DATE ) {
                                        tempKlass.push( P.settings.class_day_today )
                                    }

                                    // If it's the selected date, add the class
                                    if ( loopDate.DATE === dateSelected.DATE ) {
                                        tempKlass.push( P.settings.class_day_selected )
                                    }

                                    return tempKlass.join( ' ' )
                                })()

                            }


                            // Create the data binding object
                            // with the value as a string
                            dataBinding = {
                                name: 'date',
                                value: [
                                    loopDate.YEAR,
                                    loopDate.MONTH + 1,  // We do +1 just to give an appropriate display
                                    loopDate.DATE,
                                    loopDate.DAY
                                ].join( '/' )
                            }


                            // Pass the item to the calendar array
                            calendarDates.push( wrapItemWithTagAndClassAndBinding( 'td', loopDate.DATE, klass, dataBinding ) )


                            // If it's the end of a week
                            // * add 1 for 0index compensation
                            if ( dayOfWeekIndex + 1 === DAYS_IN_WEEK ) {

                                // Wrap the week and pass it into the calendar weeks
                                calendarWeeks.push( wrapItemWithTagAndClassAndBinding( 'tr', calendarDates.splice( 0, DAYS_IN_WEEK ) ) )
                            }

                        } //endfor



                        // Join the dates and wrap the calendar body
                        return wrapItemWithTagAndClassAndBinding( 'tbody', calendarWeeks, P.settings.class_calendar_body )
                    } //createBody

                } //endreturn
            }, //createCalendarObject






            /**
             *  Creates a calendar object
             */
            createCalendar: function() {

                var

                    // Create a calendar head
                    createCalendarHead = function() {

                        var
                            wrapTableHeader = function( item, index ) {
                                return wrapItemWithTagAndClassAndBinding( 'th', item, P.settings.class_weekdays )
                            }

                        // Go through each day of the week
                        // and return a wrapped the header
                        // and then do a join.
                        // Take the result and apply another
                        // wrapper to group the cells
                        return wrapItemWithTagAndClassAndBinding( 'thead', P.settings.days_short.map( wrapTableHeader ) )
                    }/*,*/ //createCalendarHead

                    // Get the date to show in focus
                    // dateInFocus = new Date( /*2012, 11, 21*/ ),

                    // temp: get the date provided or selected
                    // dateSelected = new Date( 2012, 9, 26 )


                /*// Store the current year
                P.DATE_INFOCUS = {
                    YEAR: dateInFocus.getFullYear(),
                    MONTH: dateInFocus.getMonth(),
                    DATE: dateInFocus.getDate(),
                    DAY: dateInFocus.getDay()
                }

                // Store the selected year
                P.DATE_SELECTED = {
                    YEAR: dateSelected.getFullYear(),
                    MONTH: dateSelected.getMonth(),
                    DATE: dateSelected.getDate(),
                    DAY: dateSelected.getDay()
                }*/


                /*var

                    // Count the number of days in the month
                    countMonthDays = P.getCountDays( P.DATE_INFOCUS.YEAR, P.DATE_INFOCUS.MONTH ),

                    // Count the days to shift the start of the month
                    countShiftby = P.getCountShiftDays( P.DATE_INFOCUS.DATE, P.DATE_INFOCUS.DAY )*/



                // Create the calendar header
                P._tableHead = createCalendarHead()


                /*
                var
                    months      =       '<div class="' + P.settings.class_box_months + '">' +
                                            '<span class="">Last month</span>' +
                                            '<span class="">Today\'s month</span>' +
                                            '<span class="">Next month</span>' +
                                        '</div>',

                    years       =       '<div class="' + P.settings.class_box_years + '">' +
                                            '<span class="">Last year</span>' +
                                            '<span class="">Today\'s year</span>' +
                                            '<span class="">Next year</span>' +
                                        '</div>',
                 */



                return {

                    // Set the date
                    setDate: function( date ) {

                        console.log( date, 'here' )
                    },


                    // Create a calendar body
                    createCalendarBody: function( year, month ) {

                        var
                            pseudoIndex, klass, dataBinding,

                            loopDate,
                            loopDateObject,

                            dateObject = this,

                            // Collection of calendar dates
                            calendarDates = [],

                            // Collection of formatted calendar dates
                            calendarDatesFormatted = []


                        // If there's a year or month
                        if ( year || month ) {
                            console.log( year, month )
                            //P.updateDates( year )
                        }


                        console.log( year, month )
                        console.log( P.DATE_INFOCUS.YEAR, P.DATE_INFOCUS.MONTH )


                        // Go through all the days in the calendar
                        // and map a calendar date
                        for ( var index = 0; index < DAYS_IN_CALENDAR; index += 1 ) {


                            // Get the distance between the index
                            // and the count to shift by.
                            // This will serve as the separator
                            // between the previous, current,
                            // and next months.
                            pseudoIndex = index - countShiftby


                            // If the pseudoIndex is greater than 0
                            // and less than or equal to number of
                            // days in the month, we generate
                            // all the dates this month
                            if ( pseudoIndex > 0 && pseudoIndex <= countMonthDays ) {

                                // Create a loop date object
                                loopDateObject = {

                                    // Same as current year
                                    YEAR: P.DATE_INFOCUS.YEAR,

                                    // Same as current month
                                    MONTH: P.DATE_INFOCUS.MONTH,

                                    // The date is the pseudoIndex
                                    DATE: pseudoIndex,

                                    // The day is the index position in the week
                                    DAY: index % DAYS_IN_WEEK
                                }


                                // Set the class
                                klass = (function() {

                                    var tempKlass = []

                                    // Set the class as in focus
                                    tempKlass.push( P.settings.class_day_infocus )

                                    // If it's today, add the class
                                    if ( loopDateObject.DATE === P.DATE_INFOCUS.DATE ) {
                                        tempKlass.push( P.settings.class_day_today )
                                    }

                                    // If it's the selected date, add the class
                                    if ( loopDateObject.DATE === P.DATE_SELECTED.DATE ) {
                                        tempKlass.push( P.settings.class_day_selected )
                                    }

                                    return tempKlass.join( ' ' )
                                })()
                            }


                            // If the pseudoIndex is negative,
                            // we need the dates from the previous month.
                            // If the pseudoIndex is greater than the days
                            // in the month, we need dates from next month.
                            else {

                                // Create a new date with a negative or positive pseudoIndex
                                loopDate = new Date( P.DATE_SELECTED.YEAR, P.DATE_SELECTED.MONTH, pseudoIndex )

                                // Create a loop date object
                                loopDateObject = {
                                    YEAR: loopDate.getFullYear(),
                                    MONTH: loopDate.getMonth(),
                                    DATE: loopDate.getDate(),
                                    DAY: index % DAYS_IN_WEEK
                                }

                                // Set the class as out of focus
                                klass = P.settings.class_day_outfocus
                            }


                            // Create the data binding as a string
                            dataBinding = {
                                name: 'date',
                                value: [
                                    loopDateObject.YEAR,
                                    loopDateObject.MONTH + 1,  // We do +1 just to give an appropriate display
                                    loopDateObject.DATE,
                                    loopDateObject.DAY
                                ].join( '/' )
                            }


                            // Pass the item to the calendar array
                            calendarDates.push( wrapItemWithTagAndClassAndBinding( 'td', loopDateObject.DATE, klass, dataBinding ) )
                        }



                        // Format the calendar dates by
                        // splicing the array to group into weeks
                        for ( var i = 0; i < WEEKS_IN_CALENDAR; i += 1 ) {

                            // Splice, join, and then wrap each day
                            calendarDatesFormatted[ i ] = wrapItemWithTagAndClassAndBinding( 'tr', calendarDates.splice( 0, DAYS_IN_WEEK ) )
                        }


                        // Join the dates and wrap the calendar body
                        return wrapItemWithTagAndClassAndBinding( 'tbody', calendarDatesFormatted, P.settings.class_calendar_body )
                    }, //createCalendarBody


                    /**
                     *  Render a complete calendar
                     */
                    render: function() {

                        var
                            thisCalendar = this


                        // If there's already a table in the dom
                        if ( P.$table ) {

                            console.log( thisCalendar.createCalendarBody(  ) )

                            P.$tableBody = P.$tableBody.replaceWith( thisCalendar.createCalendarBody() )/*.on({
                                click: P.onClickCalendar
                            })*/
                            return thisCalendar
                        }


                        // Create the calendar body
                        P._tableBody = thisCalendar.createCalendarBody()


                        // Create the calendar table
                        P._table = wrapItemWithTagAndClassAndBinding( 'table', P._tableHead + P._tableBody, P.settings.class_calendar )

                        console.dir( P )


                        // Place the calendar in the dom
                        P.$table = P.$element.after( P._table ).next()


                        // Store the table body
                        // while binding delegated events
                        P.$tableBody = P.$table.find( '.' + P.settings.class_calendar_body ).on({
                            click: P.onClickCalendar
                        })


                        return thisCalendar
                    } //render

                } //return
            }, //createCalendar


            /**
             *  Get the date that determines
             *  the month to show in focus
             */
            getDateFocused: function() {

                var
                    dateFocused = new Date(),

                    calendarDateObject = {
                        YEAR: dateFocused.getFullYear(),
                        MONTH: dateFocused.getMonth(),
                        DATE: dateFocused.getDate(),
                        DAY: dateFocused.getDay()
                    }

                return calendarDateObject
            }, //getDateFocused


            /**
             *  Get the date that determines
             *  which date is selected
             */
            getDateSelected: function() {

                var
                    dateSelected = new Date( 2012, 9, 23 ),

                    calendarDateObject = {
                        YEAR: dateSelected.getFullYear(),
                        MONTH: dateSelected.getMonth(),
                        DATE: dateSelected.getDate(),
                        DAY: dateSelected.getDay()
                    }

                return calendarDateObject

                return
            },



            /**
             *  Get the count of the number of
             *  days in a month, given the
             *  month and year
             */
            getCountDays: function( year, month ) {

                var
                    // Set flip based on if month is
                    // before or after July
                    flip = ( month > 6 ) ? true : false

                // If it's February
                if ( month === 1 ) {

                    // If it's not a leap year
                    // then 28 otherwise 29
                    return ( year % 4 ) ? 28 : 29
                }


                // If it's an odd month ID
                if ( month % 2 ) {

                    // If it's after July then 31
                    // otherwise 30
                    return ( flip ) ? 31 : 30
                }


                // If it's an even month ID
                // and it's after July then 30
                // otherwise 31
                return ( flip ) ? 30 : 31
            },


            /**
             *  Get the count of the number of
             *  days to shift the month by,
             *  given the date and day of week
             */
            getCountShiftDays: function( date, day ) {

                var

                    // Get the column index for the
                    // day if month starts on 0
                    tempColumnIndex = date % DAYS_IN_WEEK


                // Compare the day index if the
                // month starts on the first day
                // with the day index
                // the date actually falls on
                return ( day >= tempColumnIndex ) ?

                    // If the actual position is greater
                    // shift by the difference in the two
                    day - tempColumnIndex :

                    // Otherwise shift by the difference
                    // between the week length and day index
                    DAYS_IN_WEEK - tempColumnIndex
            },


            /**
             *  Get the day element node
             *  of the selected day
             */
            getSelectedDay: function() {
                return P.$tableBody.find( '.' + P.settings.class_day_selected )
            },


            /**
             *  Set a day as selected by receiving
             *  the day element node
             */
            setSelectedDay: function( $day ) {

                var
                    // Get the date from the element and float
                    date = $day.data( 'date' ).split( '/' ),

                    // Create the date target object while
                    // floating the values
                    dateTarget = {
                        YEAR: +date[ 0 ],
                        MONTH: +date[ 1 ] - 1,  // We subtract one to get the month index
                        DATE: +date[ 2 ],
                        DAY: +date[ 3 ]
                    }


                // If there's no change in date, just return it back
                if ( dateTarget.DATE === P.DATE_SELECTED.DATE && dateTarget.MONTH === P.DATE_SELECTED.MONTH && dateTarget.YEAR === P.DATE_SELECTED.YEAR ) {
                    return P
                }

                // If there's a change of month
                if ( dateTarget.MONTH !== P.DATE_SELECTED.MONTH ) {

                    // Create a new calendar
                    var asdf = P.calendar.createCalendarBody( null, dateTarget.MONTH )

                    //asdf.render()
                    console.log( asdf )
                    console.log( 'new month' )

                    //debugger
                }


                // Ensure we have a selected day
                // and then set it to inactive
                P.setUnselectedDay( P.$selectedDay || P.getSelectedDay() )


                // Set as active and add the active state to the element
                P.$selectedDay = $day.addClass( P.settings.class_day_selected )

                // Update the stored selected date
                P.DATE_SELECTED = dateTarget

                return P
            },


            /**
             *  Set a day as unselected by receiving
             *  the day element node
             */
            setUnselectedDay: function( $day ) {

                // Remove the active state from the selected day
                $day.removeClass( P.settings.class_day_selected )

                // Nullify the current selected day
                P.$selectedDay = null

                return P
            },



            /**
             *  Update the selected day
             *  when receiving a delegated
             *  click on a day in the calendar
             */
            onClickCalendar: function( event ) {
                P.setSelectedDay( $( event.target || event.srcTarget ) )
            } //onClickCalendar


        } //Picker.prototype


        return Picker
    })() //DatePicker



    /**
     *  Extend jQuery
     */
    $.fn.datepicker = function( options ) {
        return this.each(function() {
            var $this = $( this )
            if ( !$this.data( 'widgets.datepicker' ) ) {
                $this.data( 'widgets.datepicker', new DatePicker( $this, options ) )
            }
            return this
        })
    }



})( jQuery, window, document );















DateInput = (function($) { // Localise the $ function

function DateInput(el, opts) {
    if (typeof(opts) != "object") opts = {};
    $.extend(this, DateInput.DEFAULT_OPTS, opts);

    this.input = $(el);
    this.bindMethodsToObj("show", "hide", "hideIfClickOutside", "keydownHandler", "selectDate");

    this.build();
    this.selectDate();
    this.hide();
};
DateInput.DEFAULT_OPTS = {
    month_names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    short_month_names: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    short_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    start_of_week: 1
};
DateInput.prototype = {
    build: function() {
        var monthNav = $('<p class="month_nav">' +
            '<span class="button prev" title="[Page-Up]">&#171;</span>' +
            ' <span class="month_name"></span> ' +
            '<span class="button next" title="[Page-Down]">&#187;</span>' +
            '</p>');
        this.monthNameSpan = $(".month_name", monthNav);
        $(".prev", monthNav).click(this.bindToObj(function() { this.moveMonthBy(-1); }));
        $(".next", monthNav).click(this.bindToObj(function() { this.moveMonthBy(1); }));

        var yearNav = $('<p class="year_nav">' +
            '<span class="button prev" title="[Ctrl+Page-Up]">&#171;</span>' +
            ' <span class="year_name"></span> ' +
            '<span class="button next" title="[Ctrl+Page-Down]">&#187;</span>' +
            '</p>');
        this.yearNameSpan = $(".year_name", yearNav);
        $(".prev", yearNav).click(this.bindToObj(function() { this.moveMonthBy(-12); }));
        $(".next", yearNav).click(this.bindToObj(function() { this.moveMonthBy(12); }));

        var nav = $('<div class="nav"></div>').append(monthNav, yearNav);

        var tableShell = "<table><thead><tr>";
        $(this.adjustDays(this.short_day_names)).each(function() {
            tableShell += "<th>" + this + "</th>";
        });
        tableShell += "</tr></thead><tbody></tbody></table>";

        this.dateSelector = this.rootLayers = $('<div class="date_selector"></div>').append(nav, tableShell).insertAfter(this.input);

        if ($.browser.msie && $.browser.version < 7) {
            // The ieframe is a hack which works around an IE <= 6 bug where absolutely positioned elements
            // appear behind select boxes. Putting an iframe over the top of the select box prevents this.
            this.ieframe = $('<iframe class="date_selector_ieframe" frameborder="0" src="#"></iframe>').insertBefore(this.dateSelector);
            this.rootLayers = this.rootLayers.add(this.ieframe);

            // IE 6 only does :hover on A elements
            $(".button", nav).mouseover(function() { $(this).addClass("hover") });
            $(".button", nav).mouseout(function() { $(this).removeClass("hover") });
        };

        this.tbody = $("tbody", this.dateSelector);

        this.input.change(this.bindToObj(function() { this.selectDate(); }));
        this.selectDate();
    },

    selectMonth: function(date) {
        var newMonth = new Date(date.getFullYear(), date.getMonth(), 1);

        if (!this.currentMonth || !(this.currentMonth.getFullYear() == newMonth.getFullYear() &&
                                                                this.currentMonth.getMonth() == newMonth.getMonth())) {
            // We have moved to a different month and so need to re-draw the table
            this.currentMonth = newMonth;

            // Work out the range of days we will draw
            var rangeStart = this.rangeStart(date), rangeEnd = this.rangeEnd(date);
            var numDays = this.daysBetween(rangeStart, rangeEnd);
            var dayCells = "";

            // Draw each of the days
            for (var i = 0; i <= numDays; i++) {
                var currentDay = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i, 12, 00);

                if (this.isFirstDayOfWeek(currentDay)) dayCells += "<tr>";

                if (currentDay.getMonth() == date.getMonth()) {
                    dayCells += '<td class="selectable_day" date="' + this.dateToString(currentDay) + '">' + currentDay.getDate() + '</td>';
                } else {
                    dayCells += '<td class="unselected_month" date="' + this.dateToString(currentDay) + '">' + currentDay.getDate() + '</td>';
                };

                if (this.isLastDayOfWeek(currentDay)) dayCells += "</tr>";
            };
            this.tbody.empty().append(dayCells);

            // Write the month and year in the header
            this.monthNameSpan.empty().append(this.monthName(date));
            this.yearNameSpan.empty().append(this.currentMonth.getFullYear());

            $(".selectable_day", this.tbody).click(this.bindToObj(function(event) {
                this.changeInput($(event.target).attr("date"));
            }));

            $("td[date=" + this.dateToString(new Date()) + "]", this.tbody).addClass("today");

            $("td.selectable_day", this.tbody).mouseover(function() { $(this).addClass("hover") });
            $("td.selectable_day", this.tbody).mouseout(function() { $(this).removeClass("hover") });
        };

        $('.selected', this.tbody).removeClass("selected");
        $('td[date=' + this.selectedDateString + ']', this.tbody).addClass("selected");
    },

    // Select a particular date. If the date is not specified it is read from the input. If no date is
    // found then the current date is selected. The selectMonth() function is responsible for actually
    // selecting a particular date.
    selectDate: function(date) {
        if (typeof(date) == "undefined") {
            date = this.stringToDate(this.input.val());
        };
        if (!date) date = new Date();

        this.selectedDate = date;
        this.selectedDateString = this.dateToString(this.selectedDate);
        this.selectMonth(this.selectedDate);
    },

    // Write a date string to the input and hide. Trigger the change event so we know to update the
    // selectedDate.
    changeInput: function(dateString) {
        this.input.val(dateString).change();
        this.hide();
    },

    show: function() {
        this.rootLayers.css("display", "block");
        $([window, document.body]).click(this.hideIfClickOutside);
        this.input.unbind("focus", this.show);
        $(document.body).keydown(this.keydownHandler);
        this.setPosition();
    },

    hide: function() {
        this.rootLayers.css("display", "none");
        $([window, document.body]).unbind("click", this.hideIfClickOutside);
        this.input.focus(this.show);
        $(document.body).unbind("keydown", this.keydownHandler);
    },

    // We should hide the date selector if a click event happens outside of it
    hideIfClickOutside: function(event) {
        if (event.target != this.input[0] && !this.insideSelector(event)) {
            this.hide();
        };
    },

    // Returns true if the given event occurred inside the date selector
    insideSelector: function(event) {
        var offset = this.dateSelector.position();
        offset.right = offset.left + this.dateSelector.outerWidth();
        offset.bottom = offset.top + this.dateSelector.outerHeight();

        return event.pageY < offset.bottom &&
                     event.pageY > offset.top &&
                     event.pageX < offset.right &&
                     event.pageX > offset.left;
    },

    // Respond to various different keyboard events
    keydownHandler: function(event) {
        switch (event.keyCode)
        {
            case 9: // tab
            case 27: // esc
                this.hide();
                return;
            break;
            case 13: // enter
                this.changeInput(this.selectedDateString);
            break;
            case 33: // page up
                this.moveDateMonthBy(event.ctrlKey ? -12 : -1);
            break;
            case 34: // page down
                this.moveDateMonthBy(event.ctrlKey ? 12 : 1);
            break;
            case 38: // up
                this.moveDateBy(-7);
            break;
            case 40: // down
                this.moveDateBy(7);
            break;
            case 37: // left
                this.moveDateBy(-1);
            break;
            case 39: // right
                this.moveDateBy(1);
            break;
            default:
                return;
        }
        event.preventDefault();
    },

    stringToDate: function(string) {
        var matches;
        if (matches = string.match(/^(\d{1,2}) ([^\s]+) (\d{4,4})$/)) {
            return new Date(matches[3], this.shortMonthNum(matches[2]), matches[1], 12, 00);
        } else {
            return null;
        };
    },

    dateToString: function(date) {
        return date.getDate() + " " + this.short_month_names[date.getMonth()] + " " + date.getFullYear();
    },

    setPosition: function() {
        var offset = this.input.offset();
        this.rootLayers.css({
            top: offset.top + this.input.outerHeight(),
            left: offset.left
        });

        if (this.ieframe) {
            this.ieframe.css({
                width: this.dateSelector.outerWidth(),
                height: this.dateSelector.outerHeight()
            });
        };
    },

    // Move the currently selected date by a particular number of days
    moveDateBy: function(amount) {
        var newDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + amount);
        this.selectDate(newDate);
    },

    // Move the month of the currently selected date by a particular number of months. If we are moving
    // to a month which does not have enough days to represent the current day-of-month, then we
    // default to the last day of the month.
    moveDateMonthBy: function(amount) {
        var newDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + amount, this.selectedDate.getDate());
        if (newDate.getMonth() == this.selectedDate.getMonth() + amount + 1) {
            // We have moved too far. For instance 31st March + 1 month = 1st May, not 30th April
            newDate.setDate(0);
        };
        this.selectDate(newDate);
    },

    // Move the currently displayed month by a certain amount. This does *not* move the currently
    // selected date, so we end up viewing a month with no visibly selected date.
    moveMonthBy: function(amount) {
        var newMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + amount, this.currentMonth.getDate());
        this.selectMonth(newMonth);
    },

    monthName: function(date) {
        return this.month_names[date.getMonth()];
    },

    // A hack to make "this" refer to this object instance when inside the given function
    bindToObj: function(fn) {
        var self = this;
        return function() { return fn.apply(self, arguments) };
    },

    // See above
    bindMethodsToObj: function() {
        for (var i = 0; i < arguments.length; i++) {
            this[arguments[i]] = this.bindToObj(this[arguments[i]]);
        };
    },

    // Finds out the array index of a particular value in that array
    indexFor: function(array, value) {
        for (var i = 0; i < array.length; i++) {
            if (value == array[i]) return i;
        };
    },

    // Finds the number of a given month name
    monthNum: function(month_name) {
        return this.indexFor(this.month_names, month_name);
    },

    // Finds the number of a given short month name
    shortMonthNum: function(month_name) {
        return this.indexFor(this.short_month_names, month_name);
    },

    // Finds the number of a given day name
    shortDayNum: function(day_name) {
        return this.indexFor(this.short_day_names, day_name);
    },

    // Works out the number of days between two dates
    daysBetween: function(start, end) {
        start = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
        end = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
        return (end - start) / 86400000;
    },

    /*
    changeDayTo: Given a date, move along the date line in the given direction until we reach the
    desired day of week.

    The maths is a bit complex, here's an explanation.

    Think of a continuous repeating number line like:

    .. 5 6 0 1 2 3 4 5 6 0 1 2 3 4 5 6 0 1 ..

    We are essentially trying to find the difference between two numbers
    on the line in one direction (dictated by the sign of direction variable).
    Unfortunately Javascript's modulo operator works such that -5 % 7 = -5,
    instead of -5 % 7 = 2, so we need to only work with the positives.

    To find the difference between 1 and 4, going backwards, we can treat 1
    as (1 + 7) = 8, so the different is |8 - 4| = 4. If we don't cross the
    boundary between 0 and 6, for instance to find the backwards difference
    between 5 and 2, |(5 + 7) - 2| = |12 - 2| = 10. And 10 % 7 = 3.

    Going forwards, to find the difference between 4 and 1, we again treat 1
    as (1 + 7) = 8, and the difference is |4 - 8| = 4. If we don't cross the
    boundary, the difference between 2 and 5 is |2 - (5 + 7)| = |2 - 12| = 10.
    And 10 % 7 = 3.

    Once we have the positive difference in either direction represented as a
    absolute value, we can multiply it by the direction variable to get the difference
    in the desired direction.

    We can condense the two methods into a single equation:

        backwardsDifference = direction * (|(currentDayNum + 7) - dayOfWeek| % 7)
                                                = direction * (|currentDayNum - dayOfWeek + 7|  % 7)

         forwardsDifference = direction * (|currentDayNum - (dayOfWeek + 7)| % 7)
                                                = direction * (|currentDayNum - dayOfWeek - 7| % 7)

        (The two equations now differ only by the +/- 7)

                         difference = direction * (|currentDayNum - dayOfWeek - (direction * 7)| % 7)
    */
    changeDayTo: function(dayOfWeek, date, direction) {
        var difference = direction * (Math.abs(date.getDay() - dayOfWeek - (direction * 7)) % 7);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + difference);
    },

    // Given a date, return the day at the start of the week *before* this month
    rangeStart: function(date) {
        return this.changeDayTo(this.start_of_week, new Date(date.getFullYear(), date.getMonth()), -1);
    },

    // Given a date, return the day at the end of the week *after* this month
    rangeEnd: function(date) {
        return this.changeDayTo((this.start_of_week - 1) % 7, new Date(date.getFullYear(), date.getMonth() + 1, 0), 1);
    },

    // Is the given date the first day of the week?
    isFirstDayOfWeek: function(date) {
        return date.getDay() == this.start_of_week;
    },

    // Is the given date the last day of the week?
    isLastDayOfWeek: function(date) {
        return date.getDay() == (this.start_of_week - 1) % 7;
    },

    // Adjust a given array of day names to begin with the configured start-of-week
    adjustDays: function(days) {
        var newDays = [];
        for (var i = 0; i < days.length; i++) {
            newDays[i] = days[(i + this.start_of_week) % 7];
        };
        return newDays;
    }
};

$.fn.date_input = function(opts) {
    return this.each(function() { new DateInput(this, opts); });
};
$.date_input = { initialize: function(opts) {
    $("input.date_input").date_input(opts);
} };

return DateInput;
})(jQuery); // End localisation of the $ function






