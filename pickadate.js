/*!
    datepicker.js v0.8.0
    By Amsul (http://amsul.ca)

    Updated: 13 November, 2012

    (c) Amsul Naeem, 2012 - http://amsul.ca
    Licensed under MIT ("expat" flavour) license.
    Hosted on http://github.com/amsul/pickadate.js
*/

/*jshint
    debug: true,
    devel: true,
    browser: true,
    asi: true
*/



;(function( $, window, document, undefined ) {

    'use strict';



    var

        // Globals & constants
        DAYS_IN_WEEK = 7,
        WEEKS_IN_CALENDAR = 6,
        DAYS_IN_CALENDAR = WEEKS_IN_CALENDAR * DAYS_IN_WEEK,

        $window = $( window ),


        /**
         *  Helper functions
         */

        // Check if a value is an array
        isArray = Array.isArray || function( value ) {
            return {}.toString.call( value ) === '[object Array]'
        },

        // Create a dom node string
        create = function( wrapper, item, klass, data ) {

            // If the item is an array, do a join
            item = ( isArray( item ) ) ? item.join( '' ) : item

            // Check for a class
            klass = ( klass ) ? ' class="' + klass + '"' : ''

            // Check for a data binding
            data = ( data && data.name ) ? ' data-' + data.name + '="' + data.value + '"' : ''

            // Return the wrapped item
            return '<' + wrapper + data + klass + '>' + item + '</' + wrapper + '>'
        },




        /**
         *  Create a Date Picker
         */
        DatePicker = function( $element, options ) {


            var
                // The Picker prototype
                P,

                // The Picker constructor
                Picker = function( $element, options ) {

                    // Ensure a valid element was passed
                    if ( $element[ 0 ].nodeName !== 'INPUT' ) return false

                    // Ensure workable options are available
                    if ( typeof options !== 'object' ) options = {}

                    // Merge the settings
                    P.settings = $.extend( {}, DatePicker.defaults, options )

                    // Create and return the picker
                    return new P.create( $element, options )
                }




            /**
             *  Create the Picker prototype
             */

            P = Picker.prototype = {

                /**
                 *  Attach the Picker constructor
                 */
                constructor: Picker,


                /**
                 *  Create the picker
                 */
                create: function( $element, options ) {

                    // Store the element
                    P.$element = $element

                    // Convert into a regular text input
                    // to remove user-agent stylings
                    P.$element[ 0 ].type = 'text'

                    // Create a calendar object and
                    // immediately render it
                    P.calendar = P.createCalendarObject().render()

                    return P
                }, //create



                /**
                 *  Create a calendar object
                 */
                createCalendarObject: function() {

                    var

                        /**
                         *  Get the nav for next and previous
                         *  month as a string
                         */
                        createMonthNav = function() {

                            var
                                prev = create( 'div', P.settings.month_prev, P.settings.class_month_prev, { name: 'nav', value: 'prev' } ),
                                next = create( 'div', P.settings.month_next, P.settings.class_month_next, { name: 'nav', value: 'next' } )

                            return prev + next
                        }, //createMonthNav

                        /**
                         *  Create the calendar table head
                         *  that contains all the weekday labels
                         */
                        tableHead = (function() {

                            var
                                wrappedTableHead = function( weekday ) {
                                    return create( 'th', weekday, P.settings.class_weekdays )
                                }

                            // Go through each day of the week
                            // and return a wrapped the header
                            // and then do a join.
                            // Take the result and apply another
                            // wrapper to group the cells
                            return create( 'thead', P.settings.days_short.map( wrappedTableHead ) )
                        })(),


                        /**
                         *  Create the calendar table body
                         */
                        createTableBody = function() {

                            var
                                // The loop date object
                                loopDate,

                                // A pseudo index will be the divider
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

                                // Boolean to check if looped day is
                                // of the month in focus or not.
                                // Initially set to true
                                isMonthFocused = true,

                                // Get today's date
                                dateToday = P.getDateToday(),

                                // Get the month in focus
                                monthFocused = P.getMonthFocused(),

                                // Get the selected date
                                dateSelected = P.getDateSelected(),

                                // Count the number of days
                                // in the focused month
                                countMonthDays = P.getCountDays( monthFocused.YEAR, monthFocused.MONTH ),

                                // Count the days to shift the start of the month
                                countShiftby = P.getCountShiftDays( monthFocused.DATE, monthFocused.DAY ),

                                // Collection of the dates visible on the calendar
                                // * This gets discarded at the end
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

                                    // Set month focused to false
                                    isMonthFocused = false

                                    // Create a new date with a negative or positive pseudoIndex
                                    loopDate = new Date( monthFocused.YEAR, monthFocused.MONTH, pseudoIndex )

                                    // Change it into a loop date object
                                    loopDate = {
                                        YEAR: loopDate.getFullYear(),
                                        MONTH: loopDate.getMonth(),
                                        DATE: loopDate.getDate(),
                                        DAY: dayOfWeekIndex
                                    }
                                }


                                // If the pseudoIndex is greater than 0
                                // and less than or equal to number of
                                // days in the month, we generate
                                // all the dates this month
                                else {

                                    // Set month focused to true
                                    isMonthFocused = true

                                    // Create a loop date object
                                    loopDate = {

                                        // Same as focused year
                                        YEAR: monthFocused.YEAR,

                                        // Same as focused month
                                        MONTH: monthFocused.MONTH,

                                        // The date is the pseudoIndex
                                        DATE: pseudoIndex,

                                        // The day is the index position in the week
                                        DAY: dayOfWeekIndex
                                    }

                                }


                                // Set the classes
                                klass = (function() {

                                    // Create a collection for the classes
                                    var klassCollection = [ P.settings.class_calendar_date ]


                                    // Set the class as in or out of focus
                                    // depending on the month
                                    klassCollection.push( ( isMonthFocused ) ? P.settings.class_day_infocus : P.settings.class_day_outfocus )


                                    // If it's today, add the class
                                    if ( loopDate.DATE === dateToday.DATE && loopDate.MONTH === dateToday.MONTH && loopDate.YEAR === dateToday.YEAR ) {
                                        klassCollection.push( P.settings.class_day_today )
                                    }


                                    // If it's the selected date, add the class
                                    if ( loopDate.DATE === dateSelected.DATE && loopDate.MONTH === dateSelected.MONTH && loopDate.YEAR === dateSelected.YEAR ) {
                                        klassCollection.push( P.settings.class_day_selected )
                                    }


                                    // Return the joined collection
                                    return klassCollection.join( ' ' )
                                })()


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
                                calendarDates.push( create( 'td', loopDate.DATE, klass, dataBinding ) )


                                // Check if it's the end of a week.
                                // * We add 1 for 0index compensation
                                if ( dayOfWeekIndex + 1 === DAYS_IN_WEEK ) {

                                    // Wrap the week and pass it into the calendar weeks
                                    calendarWeeks.push( create( 'tr', calendarDates.splice( 0, DAYS_IN_WEEK ) ) )
                                }

                            } //endfor



                            // Join the dates and wrap the calendar body
                            return create( 'tbody', calendarWeeks, P.settings.class_calendar_body )
                        }, //createTableBody


                        /**
                         *  Get the default collection
                         *  of items in a calendar
                         *  * Depends on at least one calendar body
                         */
                        getDefaultCalendarItems = function() {
                            return [

                                // The prev/next month tags
                                create( 'div', createMonthNav(), P.settings.class_month_nav ),

                                // The calendar month tag
                                create( 'div', P.getFocusedMonth(), P.settings.class_month ),

                                // The calendar year tag
                                create( 'div', P.getFocusedYear(), P.settings.class_year )
                            ]
                        } //getDefaultCalendarItems



                    return {

                        /**
                         *  Render a complete calendar
                         */
                        render: function() {

                            var
                                // Create a reference to this calendar object
                                calendarObject = this,

                                // Create the collection of calendar items
                                calendarItems = (function() {

                                    var
                                        // First create a new calendar table body
                                        tableBody = createTableBody(),

                                        // Then get the default calendar items
                                        collection = getDefaultCalendarItems()

                                    // Create the calendar table,
                                    // and push it into the collection
                                    collection.push( create( 'table', [ tableHead, tableBody ], P.settings.class_calendar ) )

                                    // Return the collection
                                    return collection
                                })(), //calendarItems


                                // Create a new calendar box
                                // with the items collection
                                calendarBoxString = create( 'div', calendarItems, P.settings.class_calendar_box ),


                                // Event to set the calendar as active
                                onCalendarActive = function() {
                                    P.calendar.setCalendarActive( true )
                                },

                                // Event to set the calendar as inactive
                                onCalendarInactive = function() {
                                    P.calendar.setCalendarActive()
                                }



                            // If a calendar holder already exists
                            if ( P.$calendarHolder ) {

                                // Just replace it with the calendar string
                                P.$calendarHolder.html( calendarBoxString )

                                // And then return
                                return calendarObject
                            }


                            // Otherwise if there's no calendar holder
                            // wrap the box with the holder and
                            // create the jQuery object
                            // while binding delegated events
                            P.$calendarHolder = $( create( 'div', calendarBoxString, P.settings.class_picker_holder ) ).on({
                                click: P.onClickCalendar,
                                mouseenter: onCalendarActive,
                                mouseleave: onCalendarInactive
                            })


                            // Insert the calendar after the element
                            // while binding the events
                            P.$element.on({

                                // Prevent user from keying a value
                                keypress: function() { return false },

                                // On tab, close the calendar
                                keydown: function( event ) {
                                    var keycode = ( event.keyCode ) ? event.keyCode : event.which
                                    if ( keycode === 9 ) {
                                        P.calendar.close()
                                    }
                                },

                                // On focus, open the calendar
                                focusin: function() { P.calendar.open() },

                                mouseenter: onCalendarActive,
                                mouseleave: onCalendarInactive
                            }).after( P.$calendarHolder )


                            // Create a random calendar id
                            calendarObject.id = Math.floor( Math.random()*1e9 )


                            // Return the calendarObject
                            return calendarObject
                        }, //render


                        /**
                         *  Open the calendar
                         */
                        open: function() {

                            var
                                // Create a reference to this calendar object
                                calendarObject = this,


                                /**
                                 *  Check if the click position asks
                                 *  for the calendar to be closed
                                 */
                                onClickWindow = function() {

                                    // If the calendar is opened
                                    if ( calendarObject.isOpen && !calendarObject.isActive ) {

                                        // Close the calendar
                                        P.calendar.close()
                                    }
                                }


                            // If it's already open, do nothing
                            if ( calendarObject.isOpen ) {
                                return calendarObject
                            }


                            // Set calendar as open
                            calendarObject.isOpen = true

                            // Add the "opened" class to the calendar holder
                            P.$calendarHolder.addClass( P.settings.class_picker_open )


                            // Bind the click event to the window
                            $window.on( 'click.P' + calendarObject.id, onClickWindow )

                            return calendarObject
                        }, //open


                        /**
                         *  Close the calendar
                         */
                        close: function() {

                            var
                                // Create a reference to this calendar object
                                calendarObject = this


                            // Set calendar as closed
                            calendarObject.isOpen = false

                            // Remove the "opened" class from the calendar holder
                            P.$calendarHolder.removeClass( P.settings.class_picker_open )

                            // Unbind the click event from the window
                            $window.off( 'click.P' + calendarObject.id )

                            return calendarObject
                        }, //close


                        /**
                         *  Set the calendar as active
                         *  ie. hovered over by the user
                         */
                        setCalendarActive: function( trueOrFalse ) {

                            var
                                // Create a reference to this calendar object
                                calendarObject = this

                            // Set the calendar state
                            calendarObject.isActive = trueOrFalse || false

                            return calendarObject
                        }, //setCalendarActive


                        /**
                         *  Set a day as selected by receiving
                         *  the day jQuery object
                         */
                        setCalendarDate: function( $dayTargeted ) {

                            var
                                // Create a reference to this calendar object
                                calendarObject = this,

                                // Get the selected day
                                $daySelected = P.findSelectedDay(),

                                // Get the selected date
                                dateSelected = P.DATE_SELECTED,

                                // Get the focused month
                                monthFocused = P.MONTH_FOCUSED,

                                // Create the targetted date array
                                // from the clicked date
                                dateTargeted = (function() {

                                    // If there is a day targetted
                                    if ( $dayTargeted ) {

                                        var dateTargetedArray = $dayTargeted.data( 'date' ).split( '/' )

                                        // Create the date target object while
                                        // floating the values
                                        return {
                                            YEAR: +dateTargetedArray[ 0 ],
                                            MONTH: +dateTargetedArray[ 1 ] - 1,  // We minus 1 to get the month at 0index
                                            DATE: +dateTargetedArray[ 2 ],
                                            DAY: +dateTargetedArray[ 3 ]
                                        }
                                    }

                                })()


                            // Check if there has been no change in date
                            // just return it
                            if ( dateTargeted && dateTargeted.YEAR === dateSelected.YEAR && dateTargeted.MONTH === dateSelected.MONTH && dateTargeted.DATE === dateSelected.DATE ) {
                                return P
                            }


                            // Set the target as the newly selected date
                            P.DATE_SELECTED = dateTargeted || P.DATE_SELECTED


                            // If it's the same month
                            if ( dateTargeted && dateTargeted.MONTH === monthFocused.MONTH ) {

                                // Remove the "selected" state from the selected date
                                $daySelected.removeClass( P.settings.class_day_selected )

                                // Add the "selected" state to the targeted date
                                $dayTargeted.addClass( P.settings.class_day_selected )
                            }

                            // Otherwise if there's been a change in month
                            else {

                                // Set the target as the newly focused month
                                P.MONTH_FOCUSED = dateTargeted || P.MONTH_FOCUSED

                                // Render a new calendar
                                P.calendar.render()
                            }


                            // If a day was targetted
                            if ( $dayTargeted ) {

                                // Set the element value
                                P.$element[ 0 ].value = P.DATE_SELECTED.DATE + ' ' + P.getSelectedMonth() + ' ' + P.DATE_SELECTED.YEAR

                                // Close the calendar
                                calendarObject.close()
                            }

                            return calendarObject
                        }, //setCalendarDate


                        /**
                         *  Change the month visible
                         *  on the calendar
                         */
                        changeMonth: function( direction ) {

                            var
                                // Add or substract a month
                                // based on the direction
                                monthAddOrSubtract = ( direction === 'prev' ) ? -1 : 1

                            // Set the month to show in focus
                            P.setMonthFocused([ P.MONTH_FOCUSED.YEAR, P.MONTH_FOCUSED.MONTH + monthAddOrSubtract, P.MONTH_FOCUSED.DATE ])

                            // Set the selected day
                            P.calendar.setCalendarDate()
                        } //changeMonth

                    } //endreturn
                }, //createCalendarObject



                /**
                 *  Get today's date calendar object
                 */
                getDateToday: function() {

                    return P.DATE_TODAY || (function() {

                        // Create a new date for today
                        var dateToday = new Date()

                        // Create and return the calendar date object
                        return P.DATE_TODAY = {
                            YEAR: dateToday.getFullYear(),
                            MONTH: dateToday.getMonth(),
                            DATE: dateToday.getDate(),
                            DAY: dateToday.getDay()
                        }
                    })()
                }, //getDateToday



                /**
                 *  Get the date that determines
                 *  the month to show in focus
                 */
                getMonthFocused: function() {

                    // If there's a date set to focus, return it
                    // otherwise focus on today
                    return P.MONTH_FOCUSED || ( P.MONTH_FOCUSED = P.getDateSelected() )
                }, //getMonthFocused

                /**
                 *  Set the date that determines
                 *  the month to show in focus
                 */
                setMonthFocused: function( calendarDateArray ) {

                    var year = calendarDateArray[ 0 ],

                        // Ensure the month ID is within range
                        month = (function( monthId ) {

                            // If the month is more than
                            // December, increase the year
                            // and make it January
                            if ( monthId > 11 ) {
                                year += 1
                                return 0
                            }

                            // If the month is less than
                            // January, decrease the year
                            // and make it December
                            if ( monthId < 0 ) {
                                year -= 1
                                return 11
                            }

                            // Otherwise just return it
                            return monthId
                        })( calendarDateArray[ 1 ] ),

                        date = calendarDateArray[ 2 ],
                        day = new Date( year, month, date ).getDay()

                    // Set and return the month focused
                    return P.MONTH_FOCUSED = {
                        YEAR: year,
                        MONTH: month,
                        DATE: date,
                        DAY: day
                    }
                }, //setMonthFocused



                /**
                 *  Get the date that determines
                 *  which date is selected
                 */
                getDateSelected: function() {

                    // If there's a date selected, return it
                    // otherwise figure out the date
                    return P.DATE_SELECTED || (function() {

                        var
                            // Create a new date from the input element
                            dateSelected = new Date( P.$element[ 0 ].value )


                        // If there's no date in the input
                        if ( dateSelected.toString() === 'Invalid Date' || isNaN( dateSelected ) ) {

                            // Get and return today's date
                            return P.DATE_SELECTED = P.getDateToday()
                        }


                        // Otherwise create and return the calendar date object
                        return P.DATE_SELECTED = {
                            YEAR: dateSelected.getFullYear(),
                            MONTH: dateSelected.getMonth(),
                            DATE: dateSelected.getDate(),
                            DAY: dateSelected.getDay()
                        }
                    })()
                }, //getDateSelected


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
                }, //getCountDays


                /**
                 *  Get the count of the number of
                 *  days to shift the month by,
                 *  given the date and day of week
                 */
                getCountShiftDays: function( date, dayIndex ) {

                    var
                        // Get the column index for the
                        // day if month starts on 0
                        tempColumnIndex = date % DAYS_IN_WEEK,

                        // Get the absolute difference
                        absoluteDifference = Math.abs( dayIndex - tempColumnIndex )


                    // Compare the day index if the
                    // month starts on the first day
                    // with the day index
                    // the date actually falls on
                    return ( dayIndex >= tempColumnIndex ) ?

                        // If the actual position is greater
                        // shift by the difference in the two
                        absoluteDifference :

                        // Otherwise shift by the difference
                        // between the week length and absolute difference
                        DAYS_IN_WEEK - absoluteDifference
                }, //getCountShiftDays


                /**
                 *  Get the focused month
                 */
                getFocusedMonth: function() {
                    return P.settings.months_full[ P.MONTH_FOCUSED.MONTH ]
                }, //getFocusedMonth


                /**
                 *  Get the focused year
                 */
                getFocusedYear: function() {
                    return P.MONTH_FOCUSED.YEAR
                }, //getFocusedYear


                /**
                 *  Get the selected date
                 */
                getSelectedDate: function() {
                    return P.DATE_SELECTED.DATE
                }, //getSelectedDate


                /**
                 *  Get the selected month as a string
                 */
                getSelectedMonth: function() {
                    return P.settings.months_full[ P.DATE_SELECTED.MONTH ]
                }, //getSelectedMonth


                /**
                 *  Get the selected month as a string
                 */
                getSelectedYear: function() {
                    return P.DATE_SELECTED.YEAR
                }, //getSelectedYear



                /**
                 *  Find the day element node
                 *  of the selected day
                 */
                findSelectedDay: function() {
                    return P.$calendarHolder.find( '.' + P.settings.class_day_selected )
                }, //findSelectedDay



                /**
                 *  Update the selected day
                 *  when receiving a delegated
                 *  click on a day in the calendar
                 */
                onClickCalendar: function( event ) {

                    var
                        // Get the jQuery target
                        $target = $( event.target || event.srcTarget ),

                        // Get the target data
                        targetData = $target.data()

                    // If there's a date provided
                    if ( targetData.date ) {

                        // Set the selected day
                        P.calendar.setCalendarDate( $target )
                    }

                    // If there's a navigator provided
                    else if ( targetData.nav ) {

                        // Change the month according to direction
                        P.calendar.changeMonth( targetData.nav )

                        // Put focus back onto the element
                        P.$element.focus()
                    }

                    // If it's something else
                    else {

                        // Put focus back onto the element
                        P.$element.focus()
                    }

                } //onClickCalendar


            } //Picker.prototype



            // Return a new Picker constructor
            return new Picker( $element, options )
        } //DatePicker




    /**
     *  Default options for the picker
     */
    DatePicker.defaults = {

        months_full: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
        months_short: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
        days_full: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
        days_short: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],

        month_prev: '&#9664;',
        month_next: '&#9654;',

        class_picker_open: 'datepicker--opened',
        class_picker_holder: 'datepicker--holder',

        class_calendar_box: 'datepicker--calendar__box',

        class_calendar: 'datepicker--calendar',
        class_calendar_body: 'datepicker--calendar__body',
        class_calendar_date: 'datepicker--calendar__date',

        class_year: 'datepicker--year',

        class_month: 'datepicker--month',
        class_month_nav: 'datepicker--month__nav',
        class_month_prev: 'datepicker--month__prev',
        class_month_next: 'datepicker--month__next',

        class_week: 'datepicker--week',
        class_weekdays: 'datepicker--weekday',

        class_day_selected: 'datepicker--day__selected',
        class_day_today: 'datepicker--day__today',
        class_day_infocus: 'datepicker--day__infocus',
        class_day_outfocus: 'datepicker--day__outfocus',

        class_box_months: 'datepicker--holder__months',
        class_box_years: 'datepicker--holder__years',
        class_box_weekdays: 'datepicker--holder__weekdays'
    } //DatePicker.defaults



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





