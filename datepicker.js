/*!
    datepicker.js v0.4.2
    By Amsul (http://amsul.ca)

    Updated: 25 October, 2012

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

                // Create a calendar object and
                // immediately render it
                P.calendar = P.createCalendarObject().render()


                // console.log( P )

                return P
            },



            /**
             *  Create a calendar object
             */
            createCalendarObject: function() {

                var

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
                    })(), //calendarHead


                    // Collection of calendar components
                    calendarComponents = [ calendarHead ]



                return {

                    /**
                     *  Render a complete calendar
                     */
                    render: function() {

                        var
                            // Create a reference to this calendar object
                            calendarObject = this


                        // Create a new calendar body
                        // and pass it into the components collection
                        calendarComponents.push( calendarObject.createBody() )


                        // Create the jQuery calendar
                        // while binding delegated events
                        P.$calendar = $( wrapItemWithTagAndClassAndBinding( 'table', calendarComponents, P.settings.class_calendar ) ).on({
                            click: P.onClickCalendar
                        })


                        // Store the calendar body
                        P.$calendarBody = P.$calendar.find( '.' + P.settings.class_calendar_body )


                        // Insert the calendar after the input element
                        P.$element.after( P.$calendar )


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
                            // of the month in focus or not.
                            // Initially set to false
                            isMonthFocused = false,

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
                            }


                            // If the pseudoIndex is greater than 0
                            // and less than or equal to number of
                            // days in the month, we generate
                            // all the dates this month
                            else {

                                // Set boolean to true
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
                                if ( loopDate.DATE === dateFocused.DATE ) {
                                    tempKlass.push( P.settings.class_day_today )
                                }


                                // If it's the selected date
                                if ( loopDate.DATE === dateSelected.DATE ) {

                                    // Add the "selected" class
                                    tempKlass.push( P.settings.class_day_selected )

                                    // Store this as the selected date
                                    P.DATE_SELECTED = loopDate
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
            }, //getCountShiftDays


            /**
             *  Get the day element node
             *  of the selected day
             */
            getSelectedDay: function() {
                return P.$calendarBody.find( '.' + P.settings.class_day_selected )
            }, //getSelectedDay


            /**
             *  Set a day as selected by receiving
             *  the day jQuery object
             */
            setStateSelected: function( $dayTargeted ) {

                var
                    // Get the previously selected date
                    dateSelected = P.getDateSelected(),

                    // Get the date from the targeted element
                    // and split into an array.
                    // Set as active and add the active state to the element
                    dateTargetedArray = $dayTargeted.data( 'date' ).split( '/' ),

                    // Create the date target object while
                    // floating the values
                    dateTargeted = {
                        YEAR: +dateTargetedArray[ 0 ],
                        MONTH: +dateTargetedArray[ 1 ] - 1,  // We minus 1 to get the month at 0index
                        DATE: +dateTargetedArray[ 2 ],
                        DAY: +dateTargetedArray[ 3 ]
                    }


                // Check if there has been a change in date
                if ( dateTargeted.YEAR === dateSelected.YEAR && dateTargeted.MONTH === dateSelected.MONTH && dateTargeted.DATE === dateSelected.DATE ) {
                    return P
                }


                // Set the selected date as unselected
                P.setStateUnselected( P.getSelectedDay() )

                // Add the "selected" state to the targeted date
                $dayTargeted.addClass( P.settings.class_day_selected )

                // Set the target as the newly selected date
                P.DATE_SELECTED = dateTargeted


                return P
            }, //setStateSelected


            /**
             *  Set a day as unselected by receiving
             *  the day jQuery object
             */
            setStateUnselected: function( $daySelected ) {

                // Remove the active state from the selected day
                $daySelected.removeClass( P.settings.class_day_selected )

                // Set the selected date to null
                P.DATE_SELECTED = null

                return P
            }, //setStateUnselected



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
                    P.setStateSelected( $target )
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





