<template>
  <NuxtLayout>
    <header>
      <nav>
        <ul>
          <li><NuxtLink to="/fetch-server-error">Fetch Server Error</NuxtLink></li>
          <li><NuxtLink to="/fetch-quote">Fetch Quote</NuxtLink></li>
          <li><NuxtLink to="/test-param/1234">Test Param</NuxtLink></li>
          <li><NuxtLink to="/catchAll/my-id-1337">Catch All Route</NuxtLink></li>
          <li><NuxtLink to="/404">404</NuxtLink></li>
          <li><NuxtLink to="/?middleware">Faulty Router Middleware</NuxtLink></li>
        </ul>
      </nav>
    </header>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup lang="ts"></script>
