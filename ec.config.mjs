import { defineEcConfig } from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";

export default defineEcConfig({
  // თემები: შეგიძლიათ აირჩიოთ ნებისმიერი VS Code თემა
  // აქ ვიყენებთ პოპულარულ დუეტს: Dark და Light რეჟიმებისთვის
  themes: ["one-dark-pro", "github-light"],

  // პლაგინების ჩართვა
  plugins: [
    pluginLineNumbers(), // ხაზების ნომრები
    pluginCollapsibleSections(), // კოდის სექციების ჩაკეცვა
  ],

  // სტილების მორგება (Style Overrides)
  styleOverrides: {
    // კოდის ბლოკის დიზაინი
    // borderRadius: '0.5rem', // მომრგვალებული კუთხეები
    // borderWidth: '1px',
    // borderColor: ({ theme }) => theme.name.includes('dark') ? '#333' : '#ddd',

    // // ჩარჩოს (Frame) დიზაინი
    // frames: {
    //   shadowColor: '#00000033', // ჩრდილი
    //   editorActiveTabBackground: ({ theme }) => theme.name.includes('dark') ? '#282a36' : '#fff',
    // },

    // ფონტის ოჯახი - JetBrains Mono კოდისთვის
    codeFontFamily:
      'var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

    // ხაზების ნომრების დიზაინი
    lineNumbers: {
      foreground: ({ theme }) =>
        theme.name.includes("dark") ? "#6272a4" : "#bbb",
    },
  },

  // ნაგულისხმევი პარამეტრები ყველა ბლოკისთვის
  defaultProps: {
    // მაგალითად: სიტყვების ავტომატური გადატანა (Word Wrap)
    wrap: true,
    // ხაზების ნომრები ჩართული იყოს ყველგან (შეგიძლიათ გათიშოთ false-ით)
    showLineNumbers: true,
  },
});
