<template>
  <div>
    <PageNavOrigin :sidebarItems="sidebarItems"/>
    <div class="icp-footer">
      <p>Copyright© 2020-{{(new Date()).getFullYear()}} 卡颂</p>
      <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备20028082号-1</a>
    </div>
  </div>
</template>

<script>
import PageNavOrigin from '@vuepress/theme-default/components/PageNav.vue'

export default {
  name: 'PageNav',
  props: ['sidebarItems'],
  components: {
    PageNavOrigin
  },
}
</script>

<style>
.icp-footer {
  text-align: center;
}

</style>
