export const styles = `
.por_portis-container {
  position: fixed;
  width: 0px;
  height: 0px;
  top: 0px;
  right: 0px;
  z-index: 2147483647;
}

@media (max-width: 576px) {
  .por_portis-container {
    bottom: 0;
    top: auto;
  }
}

.por_portis-widget-frame {
  position: fixed;
  width: 375px;
  height: 0;
  top: 20px;
  right: 20px;
  box-shadow: 0 5px 40px rgba(0,0,0,.16);
  border-radius: 8px;
  overflow: hidden;
  z-index: 2147483000;
}

@media (max-width: 576px) {
  .por_portis-widget-frame {
    bottom: 0;
    top: auto;
    width: 100%;
    right: 0;
    left: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}
`;
