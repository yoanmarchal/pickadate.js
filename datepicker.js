/*!
    datepicker.js v0.4.3
    By Amsul (http://amsul.ca)

    Updated: 07 November, 2012

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

            MONTHS = [
                'January', 'February', 'March', 'April',
                'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'
            ],


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
                return '<' + wrapper + data + klass + '>' + item + '</' + wrapper + '>'
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
                    // Get today's date once
                    today = P.getDateToday(),

                    // Create the calendar head
                    calendarHead = (function() {

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
                    })() //calendarHead


                return {

                    /**
                     *  Render a complete calendar
                     */
                    render: function() {

                        var
                            calendarString = '',

                            // Create a reference to this calendar object
                            calendarObject = this,

                            // Create a new calendar body
                            calendarBody = calendarObject.createBody()


                        // Create the calendar month tag
                        calendarString += wrapItemWithTagAndClassAndBinding( 'div', P.getMonthString(), 'asdfasdfsdf' )

                        // Create the calendar table
                        calendarString += wrapItemWithTagAndClassAndBinding( 'table', [ calendarHead, calendarBody ], P.settings.class_calendar )



                        // If a calendar box already exists
                        if ( P.$calendarBox ) {

                            // Just replace it with the calendar string
                            P.$calendarBox.html( calendarString )
                        }


                        // Otherwise if there's no calendar box
                        else {

                            // Create the jQuery calendar box
                            // while binding delegated events
                            P.$calendarBox = $( wrapItemWithTagAndClassAndBinding( 'div', calendarString ) ).on({
                                click: P.onClickCalendar
                            })

                            // Insert the calendar after the input element
                            P.$element.after( P.$calendarBox )
                        }


                        return calendarObject
                    }, //render


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

                            // Boolean to check if looped day is
                            // of the month in focus or not
                            isMonthFocused,

                            // Get the focused date
                            dateFocused = P.getDateFocused(),

                            // Get the selected date
                            dateSelected = P.getDateSelected(),

                            // Count the number of days in the month
                            countMonthDays = P.getCountDays( dateFocused.YEAR, dateFocused.MONTH ),

                            // Count the days to shift the start of the month
                            countShiftby = P.getCountShiftDays( dateFocused.DATE, dateFocused.DAY ),

                            // Collection of the dates visible on the calendar
                            // * This gets discarded at the end
                            calendarDates = [],

                            // Collection of weeks visible on calendar
                            calendarWeeks = []



                        // Go through all the days in the calendar
                        // and map a calendar date
                        for ( var index = 0; index < DAYS_IN_CALENDAR; index += 1 ) {

                            // Set month focused to false
                            isMonthFocused = false

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
                                    YEAR: dateFocused.YEAR,

                                    // Same as focused month
                                    MONTH: dateFocused.MONTH,

                                    // The date is the pseudoIndex
                                    DATE: pseudoIndex,

                                    // The day is the index position in the week
                                    DAY: dayOfWeekIndex
                                }

                            }


                            // Set the classes
                            klass = (function() {

                                // Create a collection for the classes
                                var tempKlass = []


                                // Set the class as in or out of focus
                                // depending on the month
                                tempKlass.push( ( isMonthFocused ) ? P.settings.class_day_infocus : P.settings.class_day_outfocus )


                                // If it's today, add the class
                                if ( loopDate.DATE === today.DATE && loopDate.MONTH === today.MONTH ) {
                                    tempKlass.push( P.settings.class_day_today )
                                }


                                // If it's the selected date, add the class
                                if ( loopDate.DATE === dateSelected.DATE && loopDate.MONTH === dateSelected.MONTH ) {
                                    tempKlass.push( P.settings.class_day_selected )
                                }


                                // Return the joined collection
                                return tempKlass.join( ' ' )
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
                            calendarDates.push( wrapItemWithTagAndClassAndBinding( 'td', loopDate.DATE, klass, dataBinding ) )


                            // Check if it's the end of a week.
                            // * We add 1 for 0index compensation
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
             *  Get today's date
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
            },



            /**
             *  Get the date that determines
             *  the month to show in focus
             */
            getDateFocused: function() {

                // If there's a date set to focus, return it
                // otherwise figure out the date
                return P.DATE_FOCUSED || (function() {

                        // Set the date to today
                        var dateFocused = new Date()

                        // Create the calendar date object
                        P.DATE_FOCUSED = {
                            YEAR: dateFocused.getFullYear(),
                            MONTH: dateFocused.getMonth(),
                            DATE: dateFocused.getDate(),
                            DAY: dateFocused.getDay()
                        }

                        return P.DATE_FOCUSED
                })()
            }, //getDateFocused


            /**
             *  Get the date that determines
             *  which date is selected
             */
            getDateSelected: function() {

                // If there's a date selected, return it
                // otherwise figure out the date
                return P.DATE_SELECTED || (function() {

                    var dateSelected

                    // Get the date from the input element
                    // -- todo

                    // If there's no date in the input select today
                    if ( !dateSelected ) {
                        dateSelected = new Date()
                    }

                    // Create the calendar date object
                    P.DATE_SELECTED = {
                        YEAR: dateSelected.getFullYear(),
                        MONTH: dateSelected.getMonth(),
                        DATE: dateSelected.getDate(),
                        DAY: dateSelected.getDay()
                    }

                    return P.DATE_SELECTED
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
             *  Get the day element node
             *  of the selected day
             */
            getSelectedDay: function() {
                return P.$calendarBox.find( '.' + P.settings.class_day_selected )
            }, //getSelectedDay


            /**
             *  Get the focused month as a string
             */
            getMonthString: function() {
                return MONTHS[ P.DATE_FOCUSED.MONTH ]
            }, //getMonthString


            /**
             *  Set a day as selected by receiving
             *  the day jQuery object
             */
            setCalendarDate: function( $dayTargeted ) {

                var
                    // Get the selected day
                    $daySelected = P.getSelectedDay(),

                    // Get the selected date
                    dateSelected = P.DATE_SELECTED,

                    // Get the focused date
                    dateFocused = P.DATE_FOCUSED,

                    // Create the targetted date array
                    // from the clicked date
                    dateTargetedArray = $dayTargeted.data( 'date' ).split( '/' ),

                    // Create the date target object while
                    // floating the values
                    dateTargeted = {
                        YEAR: +dateTargetedArray[ 0 ],
                        MONTH: +dateTargetedArray[ 1 ] - 1,  // We minus 1 to get the month at 0index
                        DATE: +dateTargetedArray[ 2 ],
                        DAY: +dateTargetedArray[ 3 ]
                    }


                // Check if there has been no change in date
                // just return it
                if ( dateTargeted.YEAR === dateSelected.YEAR && dateTargeted.MONTH === dateSelected.MONTH && dateTargeted.DATE === dateSelected.DATE ) {
                    return P
                }


                // Set the target as the newly selected date
                P.DATE_SELECTED = dateTargeted


                // If it's the same month
                if ( dateTargeted.MONTH === dateFocused.MONTH ) {

                    // Remove the "selected" state from the selected date
                    $daySelected.removeClass( P.settings.class_day_selected )

                    // Add the "selected" state to the targeted date
                    $dayTargeted.addClass( P.settings.class_day_selected )
                }

                // Otherwise if there's been a change in month
                else {

                    // Set the target as the newly focused date
                    P.DATE_FOCUSED = dateTargeted

                    // Render a new calendar
                    P.calendar.render()
                }

                return P
            }, //setCalendarDate



            /**
             *  Update the selected day
             *  when receiving a delegated
             *  click on a day in the calendar
             */
            onClickCalendar: function( event ) {

                // Get the jQuery target
                var $target = $( event.target || event.srcTarget )

                // If there's a date provided
                if ( $target.data( 'date' ) ) {

                    // Set the selected day
                    P.setCalendarDate( $target )
                }
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





