# National Management Information System (NMIS) — Multi-Folder Upload Report

**Author**: Manus AI  
**Date**: August 15, 2026  
**Target Environment**: Production (`https://odchcnmis.online`)  

---

## Executive Summary

To satisfy your requirement for **uploading multiple folders at once**, we have upgraded both the Enrolment and Financial data ingestion centers (`EnrolmentUploadPage.tsx` and `DataUploadCentrePage.tsx`) along with the drop-collection utility (`uploadFiles.ts`).

Users can now select, drop, or queue **multiple folders simultaneously** in a single drag-and-drop action, or add folders sequentially using the new dedicated **"Add Folder"** button in the uploader sidebars.

---

## 1. Key Enhancements

1. **Multi-Folder Drag & Drop**: Dropping multiple directories onto the upload dropzone recursively walks all nested directory entries (`webkitGetAsEntry`), extracting and validating all supported Excel (`.xlsx`, `.xls`) and CSV workbooks across all dropped folders.
2. **Dedicated Sidebar "Add Folder" Button**: In addition to adding individual files, both upload sidebars now feature an explicit **"Add Folder"** button with directory selection enabled, allowing you to append additional folders of workbooks to the active queue at any time.
3. **Robust Deduplication**: The file collection filter automatically prevents duplicate queue entries when dropping overlapping folder structures while correctly preserving distinct workbooks across multiple directories.

---

## Conclusion

The multi-folder upload capability is fully implemented, built, committed (`bd94cb7`), and deployed to production on Vercel (`https://odchcnmis.online`).
