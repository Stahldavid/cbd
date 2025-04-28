import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  text-align: center;
  padding: 1rem;
  margin-top: 0.5rem;
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.8rem;
  
  @media (prefers-color-scheme: dark) {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FooterText = styled.p`
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const Footer = () => {
  return (
    <FooterContainer>
      <FooterText>© 2025 CuraAI • Informações para fins educativos apenas</FooterText>
      <FooterText>Sempre consulte um profissional de saúde qualificado</FooterText>
    </FooterContainer>
  );
};