<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for rendering Network Connection Points.
 * SVG filters.
<*************************************************************************** -->

<template>
    <!-- Connection point when the mouse hovers over it -->
    <filter id="kre:fltCPHover">
        <feBlend in="SourceGraphic" in2="BackgroundImage" mode="screen" />
    </filter>
</template>