<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Ephemeral box appearing at the time of a component transformation.
 *    SVG filters.
<*************************************************************************** -->

<template>
    <!-- Transform box itself when in rotation mode -->
    <filter id="kre:fltTrBoxRotated">
        <feBlend in="SourceGraphic" in2="BackgroundImage" mode="lighten" />
    </filter>
    <!-- Rotation hub (center) -->
    <filter id="kre:fltTrBoxHub">
        <feBlend in="SourceGraphic" in2="BackgroundImage" mode="screen" />
    </filter>
</template>