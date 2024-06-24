<template>
  <NuxtLayout>
    <header>
      <nav>
        <ul>
          <li><NuxtLink to="/test-param/1234">About</NuxtLink></li>
          <li><NuxtLink to="/catchAll/my-id-1337">Post 1</NuxtLink></li>
          <li><NuxtLink to="/404">404</NuxtLink></li>
          <li><NuxtLink to="/?middleware">Faulty Router Middleware</NuxtLink></li>
        </ul>
      </nav>
    </header>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup lang="ts"></script>
