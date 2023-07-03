<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Network links - SVG filters.
<*************************************************************************** -->

<template>
    <!-- Transform box itself when in rotation mode -->
    <filter id="kre:fltLinkFilter">
        <feBlend in="SourceGraphic" in2="BackgroundImage" mode="multiply" />
    </filter>
</template>